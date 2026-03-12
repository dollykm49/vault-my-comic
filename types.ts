
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum SubscriptionTier {
  FREE = 'ROOKIE_INFORMANT',
  COLLECTOR = 'GUMSHOE_DETECTIVE',
  VAULT_ELITE = 'THE_MASTERMIND',
  ARTLAB = 'ARTLAB_PRO'
}

export enum PurchaseType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  SCAN_PACK = 'SCAN_PACK',
  ARTLAB = 'ARTLAB'
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  subscription: SubscriptionTier;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  stripeCustomerId?: string;
  stripeAccountId?: string;
  stripeConnected: boolean;
  isSeller: boolean;
  isSellerVerified?: boolean;
  freeScansRemaining: number;
  purchasedScansRemaining: number;
  hasArtLab: boolean;
  joinedDate: number;
  lastBillingDate?: number;
  storageUsed?: number;
  storageLimit?: number;
}

export interface GeneratedArt {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  isRead: boolean;
}

export interface Conversation {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface GradingReport {
  grade: number;
  estimatedValue: number;
  analysis: string;
  corners: string;
  edges: string;
  surface: string;
  centering: string;
  images: string[];
  date: number;
}

export interface Comic {
  id: string;
  ownerId: string;
  title: string;
  issueNumber: string;
  publisher: string;
  publishYear: number;
  conditionRating: number;
  purchasePrice: number;
  estimatedValue: number;
  coverImage: string;
  notes: string;
  isForSale: boolean;
  listingPrice?: number;
  isFeatured?: boolean;
  gradingReport?: GradingReport;
}

export interface WishlistItem {
  id: string;
  userId: string;
  title: string;
  publisher?: string;
  issueNumber?: string;
  notes?: string;
  addedDate: number;
}

export interface GradingResult {
  grade: number;
  estimatedValue: number;
  analysis: string;
  corners: string;
  edges: string;
  surface: string;
  centering: string;
  identifiedTitle?: string;
  status: 'success' | 'refused_quality' | 'refused_restoration' | 'refused_uncertain';
  refusalMessage?: string;
}

export interface ComicMetadata {
  title?: string;
  publisher: string;
  issueNumber: string;
  publishYear: number;
  briefHistory: string;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  createdAt: number;
  replyCount: number;
  lastActivity: number;
}

export interface ThreadReply {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  link?: string;
  type?: 'wishlist_match' | 'system' | 'message';
  metadata?: {
    comicId?: string;
    listingId?: string;
  };
}
