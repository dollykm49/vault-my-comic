import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

let stripeInstance: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("❌ STRIPE ERROR: STRIPE_SECRET_KEY is missing from environment variables.");
    throw new Error("Stripe is not configured on the server. Please add STRIPE_SECRET_KEY to your environment variables in the Settings menu.");
  }
  
  // Basic validation for common key prefix errors
  if (!key.startsWith('sk_') && !key.startsWith('rk_')) {
    console.error(`❌ INVALID STRIPE KEY: The provided key starts with "${key.substring(0, 7)}...". Stripe secret keys must start with "sk_" (Secret Key) or "rk_" (Restricted Key).`);
    throw new Error(`Invalid Stripe API Key format. It should start with "sk_" or "rk_". You provided a key starting with "${key.substring(0, 3)}".`);
  }

  if (!stripeInstance) {
    console.log("💳 Initializing Stripe instance...");
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL and Key are required for backend operations");
  }
  return createClient(url, key);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  if (!process.env.APP_URL) {
    console.warn("⚠️ WARNING: APP_URL is not set. Stripe redirects will default to localhost, which will fail in production.");
    console.warn("👉 ACTION REQUIRED: Please set APP_URL to your production domain (e.g., https://vaultmycomic.com) in the Settings menu.");
  } else {
    console.log(`✅ APP_URL is set to: ${process.env.APP_URL}`);
    if (!process.env.APP_URL.includes('vaultmycomic.com')) {
      console.warn(`ℹ️ NOTE: You mentioned vaultmycomic.com, but APP_URL is set to something else. Ensure they match for correct billing redirects.`);
    }
  }

  // Stripe Webhook needs raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        if (webhookSecret && sig) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          // Fallback for local testing without signature verification if secret is missing
          console.warn("⚠️ Skipping Stripe signature verification. Set STRIPE_WEBHOOK_SECRET for security.");
          console.warn("👉 For vaultmycomic.com, ensure your Stripe Webhook URL is: https://vaultmycomic.com/api/stripe/webhook");
          event = JSON.parse(req.body.toString());
        }
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const supabase = getSupabaseAdmin();

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const metadata = session.metadata;

          if (session.mode === "subscription" && metadata?.userId) {
            if (metadata.type === 'ARTLAB') {
              console.log(`🔔 ArtLab subscription completed for user ${metadata.userId}`);
              await supabase
                .from("profiles")
                .update({
                  hasArtLab: true,
                  stripeCustomerId: session.customer as string,
                })
                .eq("id", metadata.userId);
            } else if (metadata.tier) {
              // Update user subscription status
              console.log(`🔔 Subscription completed for user ${metadata.userId} (Tier: ${metadata.tier})`);
              await supabase
                .from("profiles")
                .update({
                  subscription: metadata.tier,
                  subscriptionStatus: "active",
                  stripeCustomerId: session.customer as string,
                  lastBillingDate: Date.now(),
                  freeScansRemaining: metadata.tier === 'THE_MASTERMIND' ? 9999 : 15, // Unlimited for Mastermind
                })
                .eq("id", metadata.userId);
            }
          } else if (session.mode === "payment" && metadata?.userId && metadata?.type === 'SCAN_PACK') {
            const scanCount = parseInt(metadata.scanCount || '0');
            console.log(`🔔 Scan pack purchase completed for user ${metadata.userId} (+${scanCount} scans)`);
            
            // Get current scans
            const { data: profile } = await supabase
              .from("profiles")
              .select("purchasedScansRemaining")
              .eq("id", metadata.userId)
              .single();
            
            const currentScans = profile?.purchasedScansRemaining || 0;
            
            await supabase
              .from("profiles")
              .update({
                purchasedScansRemaining: currentScans + scanCount,
                stripeCustomerId: session.customer as string,
              })
              .eq("id", metadata.userId);

          } else if (session.mode === "payment" && metadata?.buyerId && metadata?.comicId) {
            // Marketplace purchase completed
            console.log(`🔔 Marketplace purchase completed for comic ${metadata.comicId}`);
            
            // 1. Get comic details to find seller
            const { data: comic } = await supabase
              .from("comics")
              .select("*")
              .eq("id", metadata.comicId)
              .single();

            if (comic) {
              // 2. Transfer ownership
              await supabase
                .from("comics")
                .update({
                  ownerId: metadata.buyerId,
                  isForSale: false,
                  listingPrice: null,
                })
                .eq("id", metadata.comicId);

              // 3. Notify seller
              await supabase.from("notifications").insert({
                id: Math.random().toString(36).substr(2, 9),
                userId: comic.ownerId,
                title: "COMIC SOLD! 💰",
                message: `Your copy of ${comic.title} #${comic.issueNumber} was purchased. Funds are being processed.`,
                isRead: false,
                createdAt: Date.now(),
                type: "system",
                link: "/collection",
              });
            }
          }
          break;
        }

        case "account.updated": {
          const account = event.data.object as Stripe.Account;
          const userId = account.metadata?.userId;

          if (userId && account.details_submitted) {
            console.log(`🔔 Stripe Connect account updated for user ${userId}`);
            await supabase
              .from("profiles")
              .update({
                stripeConnected: true,
                stripeAccountId: account.id,
                isSeller: true,
                isSellerVerified: account.charges_enabled,
              })
              .eq("id", userId);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    }
  );

  app.use(express.json());

  // API Routes
  app.get("/api/stripe/health", async (req, res) => {
    try {
      const stripe = getStripe();
      // Try to retrieve account info to verify the key
      await stripe.accounts.retrieve();
      res.json({ 
        status: "ok", 
        configured: true,
        webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
        publishableKeySet: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY || !!process.env.STRIPE_PUBLISHABLE_KEY,
        appUrlSet: !!process.env.APP_URL
      });
    } catch (error: any) {
      res.status(500).json({ 
        status: "error", 
        error: error.message,
        configured: false
      });
    }
  });

  app.post("/api/stripe/onboard", async (req, res) => {
    try {
      const { userId, email } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const stripe = getStripe();
      const account = await stripe.accounts.create({
        type: "standard",
        email: email,
        metadata: { userId },
      });

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const inferredUrl = `${protocol}://${host}`;
      const frontendUrl = process.env.APP_URL || inferredUrl;

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${frontendUrl}/settings?stripe=refresh`,
        return_url: `${frontendUrl}/settings?stripe=success`,
        type: "account_onboarding",
      });

      res.json({ url: accountLink.url, stripeAccountId: account.id });
    } catch (error: any) {
      console.error("Stripe Onboarding Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { userId, type, tier, interval, scanPackId, email } = req.body;
      console.log(`💳 Creating Stripe Checkout Session: Type=${type}, User=${userId}, Email=${email}`);
      
      const stripe = getStripe();
      
      // Use APP_URL if available, otherwise try to infer from request headers for better reliability
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const inferredUrl = `${protocol}://${host}`;
      const frontendUrl = process.env.APP_URL || inferredUrl;

      console.log(`🔗 Using frontend URL for redirects: ${frontendUrl}`);

      let lineItems: any[] = [];
      let mode: Stripe.Checkout.Session.Mode = 'subscription';
      let metadata: any = { userId, type };

      if (type === 'SUBSCRIPTION') {
        const priceIdMap: Record<string, Record<string, string | undefined>> = {
          'GUMSHOE_DETECTIVE': { 
            month: process.env.STRIPE_PRICE_GUMSHOE_MONTH, 
            year: process.env.STRIPE_PRICE_GUMSHOE_YEAR 
          },
          'THE_MASTERMIND': { 
            month: process.env.STRIPE_PRICE_MASTERMIND_MONTH, 
            year: process.env.STRIPE_PRICE_MASTERMIND_YEAR 
          },
        };

        const priceId = priceIdMap[tier]?.[interval];

        if (priceId) {
          lineItems = [{
            price: priceId,
            quantity: 1,
          }];
        } else {
          const priceMap: Record<string, Record<string, number>> = {
            'GUMSHOE_DETECTIVE': { month: 999, year: 9599 },
            'THE_MASTERMIND': { month: 4999, year: 47999 },
          };

          const amount = priceMap[tier]?.[interval];
          if (!amount) return res.status(400).json({ error: "Invalid tier or interval" });

          lineItems = [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Comic Vault ${tier.replace(/_/g, ' ')} (${interval})`,
              },
              unit_amount: amount,
              recurring: { interval },
            },
            quantity: 1,
          }];
        }
        metadata.tier = tier;
        metadata.interval = interval;
      } else if (type === 'ARTLAB') {
        const priceId = interval === 'year' ? process.env.STRIPE_PRICE_ARTLAB_YEAR : process.env.STRIPE_PRICE_ARTLAB_MONTH;
        
        if (priceId) {
          lineItems = [{
            price: priceId,
            quantity: 1,
          }];
        } else {
          const amount = interval === 'year' ? 4799 : 499;
          lineItems = [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ArtLab Pro Subscription (${interval})`,
              },
              unit_amount: amount,
              recurring: { interval },
            },
            quantity: 1,
          }];
        }
        metadata.interval = interval;
      } else if (type === 'SCAN_PACK') {
        const scanPackPriceIdMap: Record<string, string | undefined> = {
          'scan_1': process.env.STRIPE_PRICE_SCAN_1,
          'scan_5': process.env.STRIPE_PRICE_SCAN_5,
          'scan_10': process.env.STRIPE_PRICE_SCAN_10,
          'scan_25': process.env.STRIPE_PRICE_SCAN_25,
          'scan_50': process.env.STRIPE_PRICE_SCAN_50,
        };

        const priceId = scanPackPriceIdMap[scanPackId];
        
        const scanPackMap: Record<string, { count: number, price: number }> = {
          'scan_1': { count: 1, price: 199 },
          'scan_5': { count: 5, price: 799 },
          'scan_10': { count: 10, price: 1499 },
          'scan_25': { count: 25, price: 2999 },
          'scan_50': { count: 50, price: 4999 },
        };

        const pack = scanPackMap[scanPackId];
        if (!pack) return res.status(400).json({ error: "Invalid scan pack" });

        if (priceId) {
          lineItems = [{
            price: priceId,
            quantity: 1,
          }];
        } else {
          lineItems = [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Comic Vault ${pack.count} Scan Pack`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          }];
        }
        mode = 'payment';
        metadata.scanPackId = scanPackId;
        metadata.scanCount = pack.count.toString();
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: mode,
        success_url: `${frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${frontendUrl}/billing?status=cancel`,
        customer_email: email,
        metadata: metadata,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe/create-marketplace-session", async (req, res) => {
    try {
      const { buyerId, comicId, title, price } = req.body;
      const stripe = getStripe();
      const supabase = getSupabaseAdmin();
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const inferredUrl = `${protocol}://${host}`;
      const frontendUrl = process.env.APP_URL || inferredUrl;

      // 1. Get the comic to find the owner
      const { data: comic } = await supabase
        .from("comics")
        .select("ownerId")
        .eq("id", comicId)
        .single();

      if (!comic) {
        return res.status(404).json({ error: "Comic not found" });
      }

      // 2. Get the seller's Stripe account ID
      const { data: seller } = await supabase
        .from("profiles")
        .select("stripeAccountId")
        .eq("id", comic.ownerId)
        .single();

      const sellerStripeAccountId = seller?.stripeAccountId;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: title,
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/marketplace?session_id={CHECKOUT_SESSION_ID}&comic_id=${comicId}&status=success`,
        cancel_url: `${frontendUrl}/marketplace?status=cancel`,
        metadata: { buyerId, comicId },
        // If we have a seller account, we can use application_fee_amount or transfer_data
        ...(sellerStripeAccountId && {
          payment_intent_data: {
            application_fee_amount: Math.round(price * 100 * 0.1), // 10% fee
            transfer_data: {
              destination: sellerStripeAccountId,
            },
          },
        }),
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Marketplace Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe/create-portal-session", async (req, res) => {
    try {
      const { userId } = req.body;
      const stripe = getStripe();
      const supabase = getSupabaseAdmin();
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['host'];
      const inferredUrl = `${protocol}://${host}`;
      const frontendUrl = process.env.APP_URL || inferredUrl;

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripeCustomerId")
        .eq("id", userId)
        .single();

      if (!profile?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found for this user." });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripeCustomerId,
        return_url: `${frontendUrl}/settings`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Portal Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
export default appPromise;
