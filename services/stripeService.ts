
import { User, SubscriptionTier, Comic } from '../types';
import { storageService } from './storageService';

const getBaseUrl = () => {
  // Use the environment variable if provided, otherwise fallback to relative path
  // In Vite, we should use import.meta.env
  let url = ((import.meta as any).env?.VITE_API_URL as string) || '';
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

export const stripeService = {
  /**
   * Creates a real Stripe Checkout Session for Subscription Upgrades.
   */
  createCheckoutSession: async (user: User, tier: SubscriptionTier, interval: 'month' | 'year' = 'month'): Promise<void> => {
    try {
      const safeEmail = (user.username.includes('@') ? user.username : `${user.username.replace(/\s+/g, '.')}@example.com`).toLowerCase();
      
      const response = await fetch(`${getBaseUrl()}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'SUBSCRIPTION',
          tier: tier,
          interval: interval,
          email: safeEmail
        }),
      });
  
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to create session');
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not found.');
      }
    } catch (error: any) {
      console.error('Stripe Session Error:', error);
      throw error; // Let the component handle the error message
    }
  },

  /**
   * Creates a real Stripe Checkout Session for ArtLab.
   */
  createArtLabSession: async (user: User, interval: 'month' | 'year' = 'month'): Promise<void> => {
    try {
      const safeEmail = (user.username.includes('@') ? user.username : `${user.username.replace(/\s+/g, '.')}@example.com`).toLowerCase();
      
      const response = await fetch(`${getBaseUrl()}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'ARTLAB',
          interval: interval,
          email: safeEmail
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to create session');
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not found.');
      }
    } catch (error: any) {
      console.error('ArtLab Session Error:', error);
      throw error;
    }
  },

  /**
   * Creates a real Stripe Checkout Session for Scan Packs.
   */
  createScanPackSession: async (user: User, scanPackId: string): Promise<void> => {
    try {
      const safeEmail = (user.username.includes('@') ? user.username : `${user.username.replace(/\s+/g, '.')}@example.com`).toLowerCase();
      
      const response = await fetch(`${getBaseUrl()}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'SCAN_PACK',
          scanPackId: scanPackId,
          email: safeEmail
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to create session');
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not found.');
      }
    } catch (error: any) {
      console.error('Scan Pack Session Error:', error);
      throw error;
    }
  },

  /**
   * Creates a real Stripe Checkout for a specific marketplace item.
   */
  handleMarketplacePurchase: async (buyer: User, comic: Comic): Promise<void> => {
    try {
      const price = comic.listingPrice || comic.estimatedValue;
      
      const response = await fetch(`${getBaseUrl()}/api/stripe/create-marketplace-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyer.id,
          comicId: comic.id,
          title: `${comic.title} #${comic.issueNumber}`,
          price: price,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to create session');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not found.');
      }
    } catch (error: any) {
      console.error('Marketplace Purchase Error:', error);
      throw error;
    }
  },

  /**
   * Creates a real Stripe Customer Portal session.
   */
  createPortalSession: async (user: User) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to create portal session');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Portal URL not found.');
      }
    } catch (error: any) {
      console.error('Portal Error:', error);
      throw error;
    }
  },

  /**
   * Real Stripe Connect Express Onboarding flow for marketplace sellers.
   */
  createConnectOnboarding: async (user: User): Promise<void> => {
    try {
      const safeEmail = (user.username.includes('@') ? user.username : `${user.username.replace(/\s+/g, '.')}@example.com`).toLowerCase();
      
      const response = await fetch(`${getBaseUrl()}/api/stripe/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: safeEmail
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to start onboarding');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Onboarding URL not found.');
      }
    } catch (error: any) {
      console.error('Onboarding Error:', error);
      throw error;
    }
  }
};
