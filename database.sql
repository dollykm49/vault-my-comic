
-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  "username" TEXT,
  "displayName" TEXT,
  "role" TEXT DEFAULT 'USER',
  "subscription" TEXT DEFAULT 'ROOKIE_INFORMANT',
  "subscriptionStatus" TEXT,
  "stripeCustomerId" TEXT,
  "stripeAccountId" TEXT,
  "stripeConnected" BOOLEAN DEFAULT FALSE,
  "isSeller" BOOLEAN DEFAULT FALSE,
  "isSellerVerified" BOOLEAN DEFAULT FALSE,
  "freeScansRemaining" INTEGER DEFAULT 3,
  "purchasedScansRemaining" INTEGER DEFAULT 0,
  "hasArtLab" BOOLEAN DEFAULT FALSE,
  "joinedDate" BIGINT,
  "lastBillingDate" BIGINT,
  "storageUsed" BIGINT,
  "storageLimit" BIGINT
);

-- 2. COMICS TABLE
CREATE TABLE IF NOT EXISTS "comics" (
  "id" TEXT PRIMARY KEY,
  "ownerId" UUID REFERENCES auth.users ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "issueNumber" TEXT,
  "publisher" TEXT,
  "publishYear" INTEGER,
  "conditionRating" FLOAT,
  "purchasePrice" FLOAT,
  "estimatedValue" FLOAT,
  "coverImage" TEXT,
  "notes" TEXT,
  "isForSale" BOOLEAN DEFAULT FALSE,
  "listingPrice" FLOAT,
  "isFeatured" BOOLEAN DEFAULT FALSE,
  "gradingReport" JSONB
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS "messages" (
  "id" BIGSERIAL PRIMARY KEY,
  "senderId" UUID REFERENCES auth.users ON DELETE CASCADE,
  "receiverId" UUID REFERENCES auth.users ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE
);

-- 4. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" TEXT PRIMARY KEY,
  "userId" UUID REFERENCES auth.users ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "publisher" TEXT,
  "issueNumber" TEXT,
  "notes" TEXT,
  "addedDate" BIGINT NOT NULL
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY,
  "userId" UUID REFERENCES auth.users ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" BIGINT NOT NULL,
  "link" TEXT,
  "type" TEXT,
  "metadata" JSONB
);

-- RLS POLICIES (Row Level Security)

-- Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON "profiles" FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON "profiles" FOR UPDATE USING (auth.uid() = "id");
CREATE POLICY "Users can insert own profile" ON "profiles" FOR INSERT WITH CHECK (auth.uid() = "id");

-- Comics: Everyone can see comics for sale, owners can see and manage all their own
CREATE POLICY "Comics for sale are public" ON "comics" FOR SELECT USING ("isForSale" = true);
CREATE POLICY "Owners can view their own comics" ON "comics" FOR SELECT USING (auth.uid() = "ownerId");
CREATE POLICY "Owners can insert their own comics" ON "comics" FOR INSERT WITH CHECK (auth.uid() = "ownerId");
CREATE POLICY "Owners can update their own comics" ON "comics" FOR UPDATE USING (auth.uid() = "ownerId");
CREATE POLICY "Owners can delete their own comics" ON "comics" FOR DELETE USING (auth.uid() = "ownerId");

-- Messages: Users can only see messages they sent or received
CREATE POLICY "Users can see their own messages" ON "messages" FOR SELECT USING (auth.uid() = "senderId" OR auth.uid() = "receiverId");
CREATE POLICY "Users can send messages" ON "messages" FOR INSERT WITH CHECK (auth.uid() = "senderId");
CREATE POLICY "Users can update read status of received messages" ON "messages" FOR UPDATE USING (auth.uid() = "receiverId");

-- Wishlist: Users can only see and manage their own wishlist
CREATE POLICY "Users can view their own wishlist" ON "wishlist" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert into their own wishlist" ON "wishlist" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own wishlist" ON "wishlist" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete from their own wishlist" ON "wishlist" FOR DELETE USING (auth.uid() = "userId");

-- Notifications: Users can only see and manage their own notifications
CREATE POLICY "Users can view their own notifications" ON "notifications" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can update their own notifications" ON "notifications" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own notifications" ON "notifications" FOR DELETE USING (auth.uid() = "userId");
CREATE POLICY "System can insert notifications" ON "notifications" FOR INSERT WITH CHECK (true);
