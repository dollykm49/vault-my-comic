
import { supabase } from '../supabase';
import { Comic, Notification, User, Message, Conversation, WishlistItem, Thread, ThreadReply } from '../types';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const storageService = {
  // --- ASSET STORAGE (Images) ---
  
  /**
   * Uploads a base64 image to Supabase Storage and returns the public URL.
   */
  uploadFile: async (path: string, base64Data: string): Promise<string> => {
    if (!supabase) throw new Error("Supabase not initialized");

    // Calculate approximate size of base64 string
    const stringLength = base64Data.length - (base64Data.indexOf(',') + 1);
    const sizeInBytes = (stringLength * 3) / 4;

    if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`File is too large (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
    }

    const format = base64Data.split(';')[0].split('/')[1] || 'jpeg';
    const cleanData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Convert base64 to Blob
    const byteCharacters = atob(cleanData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${format}` });

    const { data, error } = await supabase.storage
      .from('comics')
      .upload(path, blob, {
        contentType: `image/${format}`,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('comics')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // --- PROFILES ---
  getProfile: async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data as User;
  },

  createProfile: async (userId: string, user: User) => {
    if (!supabase) return;
    await supabase.from('profiles').upsert({ ...user, id: userId });
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    if (!supabase) return;
    await supabase.from('profiles').update(updates).eq('id', userId);
  },

  getAllProfiles: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*');
    return (data as User[]) || [];
  },

  searchProfiles: async (query: string): Promise<User[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20);
    return (data as User[]) || [];
  },

  // --- COMICS ---
  getComics: async (userId: string): Promise<Comic[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('comics')
      .select('*')
      .eq('ownerId', userId);
    return (data as Comic[]) || [];
  },

  getMarketplaceComics: async (excludeUserId: string): Promise<Comic[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('comics')
      .select('*')
      .eq('isForSale', true)
      .neq('ownerId', excludeUserId);
    return (data as Comic[]) || [];
  },

  saveComic: async (comic: Comic) => {
    if (!supabase) return;
    await supabase.from('comics').upsert(comic);
    
    // If the comic is for sale, check for wishlist matches
    if (comic.isForSale) {
      await storageService.checkWishlistMatches(comic);
    }
  },

  checkWishlistMatches: async (comic: Comic) => {
    if (!supabase) return;
    
    // Search wishlist for matching titles
    const { data: matches } = await supabase
      .from('wishlist')
      .select('*')
      .ilike('title', `%${comic.title}%`);

    if (matches && matches.length > 0) {
      for (const match of matches) {
        // Don't notify the owner
        if (match.userId === comic.ownerId) continue;

        const notification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          userId: match.userId,
          title: 'Grail Tracker Alert! 🎯',
          message: `A comic matching "${match.title}" has just been listed in the Marketplace: ${comic.title} #${comic.issueNumber}`,
          isRead: false,
          createdAt: Date.now(),
          type: 'wishlist_match',
          link: `/marketplace?id=${comic.id}`,
          metadata: {
            comicId: comic.id
          }
        };
        await storageService.addNotification(notification);
      }
    }
  },

  deleteComic: async (comicId: string) => {
    if (!supabase) return;
    await supabase.from('comics').delete().eq('id', comicId);
  },

  transferOwnership: async (comicId: string, newOwnerId: string) => {
    if (!supabase) return;
    await supabase.from('comics').update({
      ownerId: newOwnerId,
      isForSale: false,
      listingPrice: null
    }).eq('id', comicId);
  },

  // --- MESSAGING ---
  sendMessage: async (senderId: string, receiverId: string, content: string) => {
    if (!supabase) return;
    const message = {
      senderId,
      receiverId,
      content,
      createdAt: Date.now(),
      isRead: false
    };
    await supabase.from('messages').insert(message);
  },

  getMessages: (userId: string, otherUserId: string, callback: (messages: Message[]) => void) => {
    if (!supabase) return () => {};
    
    // Initial fetch
    supabase.from('messages')
      .select('*')
      .or(`and(senderId.eq.${userId},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${userId})`)
      .order('createdAt', { ascending: true })
      .then(({ data }) => {
        if (data) callback(data as Message[]);
      });

    // Real-time subscription
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.senderId === userId && msg.receiverId === otherUserId) ||
            (msg.senderId === otherUserId && msg.receiverId === userId)) {
          // Re-fetch all or just append? For simplicity, re-fetch
          supabase.from('messages')
            .select('*')
            .or(`and(senderId.eq.${userId},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${userId})`)
            .order('createdAt', { ascending: true })
            .then(({ data }) => {
              if (data) callback(data as Message[]);
            });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    if (!supabase) return [];
    const { data: allMsgs } = await supabase
      .from('messages')
      .select('*')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
      .order('createdAt', { ascending: false });

    if (!allMsgs) return [];

    const convoMap = new Map<string, { lastMsg: Message, unread: number }>();
    allMsgs.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!convoMap.has(otherId)) convoMap.set(otherId, { lastMsg: msg, unread: 0 });
      if (msg.receiverId === userId && !msg.isRead) convoMap.get(otherId)!.unread++;
    });

    const conversations: Conversation[] = [];
    const otherIds = Array.from(convoMap.keys());
    
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherIds);

      if (profiles) {
        profiles.forEach(profile => {
          const info = convoMap.get(profile.id);
          if (info) {
            conversations.push({
              otherUser: profile as User,
              lastMessage: info.lastMsg,
              unreadCount: info.unread
            });
          }
        });
      }
    }
    
    // Sort by last message date
    return conversations.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);
  },

  markAsRead: async (userId: string, otherUserId: string) => {
    if (!supabase) return;
    await supabase.from('messages')
      .update({ isRead: true })
      .eq('receiverId', userId)
      .eq('senderId', otherUserId)
      .eq('isRead', false);
  },

  // --- WISHLIST ---
  getWishlist: async (userId: string): Promise<WishlistItem[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .eq('userId', userId)
      .order('addedDate', { ascending: false });
    return (data as WishlistItem[]) || [];
  },

  saveWishlistItem: async (item: WishlistItem) => {
    if (!supabase) return;
    await supabase.from('wishlist').upsert(item);
  },

  deleteWishlistItem: async (id: string) => {
    if (!supabase) return;
    await supabase.from('wishlist').delete().eq('id', id);
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    return (data as Notification[]) || [];
  },

  markNotificationRead: async (id: string) => {
    if (!supabase) return;
    await supabase.from('notifications').update({ isRead: true }).eq('id', id);
  },

  markAllNotificationsRead: async (userId: string) => {
    if (!supabase) return;
    await supabase.from('notifications').update({ isRead: true }).eq('userId', userId).eq('isRead', false);
  },

  deleteNotification: async (id: string) => {
    if (!supabase) return;
    await supabase.from('notifications').delete().eq('id', id);
  },

  addNotification: async (notification: Notification) => {
    if (!supabase) return;
    await supabase.from('notifications').insert(notification);
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return await storageService.getProfile(user.id);
  },

  getUser: async (userId: string): Promise<User | null> => {
    return await storageService.getProfile(userId);
  },

  updateUser: async (user: User) => {
    await storageService.updateProfile(user.id, user);
  },

  // --- COMMUNITY THREADS ---
  getThreads: async (): Promise<Thread[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('threads')
      .select('*')
      .order('lastActivity', { ascending: false });
    return (data as Thread[]) || [];
  },

  createThread: async (thread: Omit<Thread, 'id' | 'createdAt' | 'replyCount' | 'lastActivity'>) => {
    if (!supabase) return;
    const newThread = {
      ...thread,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      replyCount: 0,
      lastActivity: Date.now()
    };
    await supabase.from('threads').insert(newThread);
    return newThread;
  },

  getThreadReplies: async (threadId: string): Promise<ThreadReply[]> => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('thread_replies')
      .select('*')
      .eq('threadId', threadId)
      .order('createdAt', { ascending: true });
    return (data as ThreadReply[]) || [];
  },

  addReply: async (reply: Omit<ThreadReply, 'id' | 'createdAt'>) => {
    if (!supabase) return;
    const newReply = {
      ...reply,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    
    // Insert reply
    await supabase.from('thread_replies').insert(newReply);
    
    // Update thread activity and count
    const { data: thread } = await supabase.from('threads').select('replyCount').eq('id', reply.threadId).single();
    if (thread) {
      await supabase.from('threads').update({
        replyCount: (thread.replyCount || 0) + 1,
        lastActivity: Date.now()
      }).eq('id', reply.threadId);
    }
    
    return newReply;
  }
};
