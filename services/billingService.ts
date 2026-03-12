import { SubscriptionTier, Comic } from '../types';
import { storageService } from './storageService';
import { PRICING } from '../constants';

/**
 * GOOGLE PAY BILLING SERVICE
 * Handles both Subscriptions (Play Store) and Marketplace Transactions (One-time)
 */

let paymentsClient: any = null;

const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0
};

const allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

const baseCardPaymentMethod = {
  type: 'CARD',
  parameters: {
    allowedAuthMethods: allowedCardAuthMethods,
    allowedCardNetworks: allowedCardNetworks
  }
};

const cardPaymentMethod = Object.assign(
  {},
  baseCardPaymentMethod,
  {
    tokenizationSpecification: {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        'gateway': 'stripe',
        'gatewayMerchantId': process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
      }
    }
  }
);

export const billingService = {
  init: () => {
    if (typeof window !== 'undefined' && (window as any).google && !paymentsClient) {
      paymentsClient = new (window as any).google.payments.api.PaymentsClient({
        environment: 'TEST' 
      });
    }
    return paymentsClient;
  },

  getPaymentDataRequest: (amount: number, label: string) => {
    return Object.assign(
      {},
      baseRequest,
      {
        allowedPaymentMethods: [cardPaymentMethod],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: 'USD',
          countryCode: 'US',
          displayItems: [
            {
              label: label,
              type: 'LINE_ITEM',
              price: amount.toString(),
            }
          ]
        },
        merchantInfo: {
          merchantName: 'Comic Vault Marketplace'
        }
      }
    );
  },

  /**
   * For Marketplace Sales: Handles the Split logic simulation
   * In production, the Gateway (Stripe/PayPal) handles the actual transfer to the seller's account
   */
  processMarketplaceSale: async (comic: Comic, buyerId: string): Promise<boolean> => {
    billingService.init();
    const price = comic.listingPrice || 0;
    
    // Calculate fee based on seller's tier
    // We fetch seller data to determine their specific fee percentage
    const user = await storageService.getUser(buyerId); // Simplified
    if (!user) return false;
    
    const plan = PRICING[user.subscription];
    const platformFee = (price * plan.fee) / 100;
    const sellerNet = price - platformFee;

    console.log(`[Marketplace Split] Initiating Transaction for: ${comic.title}`);
    console.log(`- Total: $${price}`);
    console.log(`- Platform Fee (${plan.fee}%): $${platformFee.toFixed(2)}`);
    console.log(`- Seller Payout: $${sellerNet.toFixed(2)}`);

    // Simulate Google Pay auth + Gateway split processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark comic as sold or transfer ownership
    // In a real app, you would create a 'Transaction' record in Firestore
    return true;
  },

  purchaseSubscription: async (tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly'): Promise<boolean> => {
    const client = billingService.init();
    const plan = PRICING[tier];
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

    try {
      // In production, loadPaymentData triggers the Google UI
      await new Promise(resolve => setTimeout(resolve, 1500));

      const user = await storageService.getCurrentUser();
      if (!user) return false;

      const updatedUser = {
        ...user,
        subscription: tier,
        billingCycle: billingCycle,
        freeScansRemaining: tier === SubscriptionTier.VAULT_ELITE ? 999999 : plan.scansPerMonth,
        storageLimit: plan.storageLimit
      };
      
      await storageService.updateUser(updatedUser);
      return true;
    } catch (err) {
      return false;
    }
  }
};
