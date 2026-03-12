
import React, { useState, useEffect } from 'react';
import { User, Thread, ThreadReply } from '../types';
import { storageService } from '../services/storageService';
import { MessageSquare, Plus, User as UserIcon, Clock, ChevronRight, ArrowLeft, Send, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityThreadsPageProps {
  user: User;
}

const CommunityThreadsPage: React.FC<CommunityThreadsPageProps> = ({ user }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadReplies(selectedThread.id);
    }
  }, [selectedThread]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const data = await storageService.getThreads();
      setThreads(data);
      
      // If no threads exist, create a welcome thread
      if (data.length === 0) {
        const welcomeThread = await storageService.createThread({
          title: "Welcome to the Comic Vault Community! 🦸‍♂️",
          content: "This is the place to discuss your favorite grails, share collection tips, and connect with fellow heroes. Introduce yourself below!",
          authorId: "system",
          authorUsername: "Vault Master",
        });
        if (welcomeThread) setThreads([welcomeThread]);
      }
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (threadId: string) => {
    try {
      const data = await storageService.getThreadReplies(threadId);
      setReplies(data);
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const newThread = await storageService.createThread({
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
        authorId: user.id,
        authorUsername: user.username,
        authorAvatarUrl: user.avatarUrl
      });
      if (newThread) {
        setThreads([newThread, ...threads]);
        setIsCreating(false);
        setNewThreadTitle('');
        setNewThreadContent('');
        setSelectedThread(newThread);
      }
    } catch (error) {
      alert("Failed to create thread.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || !selectedThread || submitting) return;

    setSubmitting(true);
    try {
      const newReply = await storageService.addReply({
        threadId: selectedThread.id,
        authorId: user.id,
        authorUsername: user.username,
        authorAvatarUrl: user.avatarUrl,
        content: newReplyContent.trim()
      });
      if (newReply) {
        setReplies([...replies, newReply]);
        setNewReplyContent('');
        // Refresh thread to update reply count
        const updatedThreads = threads.map(t => 
          t.id === selectedThread.id ? { ...t, replyCount: t.replyCount + 1, lastActivity: Date.now() } : t
        );
        setThreads(updatedThreads);
      }
    } catch (error) {
      alert("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedThread) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Syncing Discussions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {selectedThread ? (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedThread(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#fbbf24] transition-colors font-black uppercase tracking-widest text-xs"
          >
            <ArrowLeft size={16} /> Back to Discussions
          </button>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl border-2 border-[#fbbf24]/30 overflow-hidden bg-[#1a2332] flex items-center justify-center">
                  {selectedThread.authorAvatarUrl ? (
                    <img src={selectedThread.authorAvatarUrl} alt={selectedThread.authorUsername} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-[#fbbf24]" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl comic-font text-white uppercase tracking-tight">{selectedThread.title}</h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Started by <span className="text-[#fbbf24]">{selectedThread.authorUsername}</span> • {formatDistanceToNow(selectedThread.createdAt)} ago
                  </p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedThread.content}</p>
            </div>

            <div className="p-8 space-y-8 bg-black/10">
              <h3 className="comic-font text-xl text-[#dc2626] uppercase tracking-widest">Replies ({replies.length})</h3>
              
              <div className="space-y-6">
                {replies.map(reply => (
                  <div key={reply.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-[#1a2332] shrink-0 flex items-center justify-center">
                      {reply.authorAvatarUrl ? (
                        <img src={reply.authorAvatarUrl} alt={reply.authorUsername} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={18} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-[#fbbf24] uppercase tracking-widest">{reply.authorUsername}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{formatDistanceToNow(reply.createdAt)} ago</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddReply} className="pt-6 border-t border-white/10">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl border border-[#fbbf24]/30 overflow-hidden bg-[#1a2332] shrink-0 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={18} className="text-[#fbbf24]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <textarea 
                      value={newReplyContent}
                      onChange={(e) => setNewReplyContent(e.target.value)}
                      placeholder="Add to the discussion..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] transition-all outline-none min-h-[100px] resize-none"
                    />
                    <button 
                      type="submit"
                      disabled={!newReplyContent.trim() || submitting}
                      className="bg-[#fbbf24] text-[#1a2332] px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={14} />
                      Post Reply
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl comic-font text-[#fbbf24] uppercase tracking-wider">Discussions</h1>
              <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mt-1">Connect with the collector community</p>
            </div>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="bg-[#dc2626] text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
            >
              {isCreating ? <ArrowLeft size={16} /> : <Plus size={16} />}
              {isCreating ? 'Cancel' : 'New Thread'}
            </button>
          </div>

          {isCreating ? (
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 animate-slideUp">
              <h2 className="comic-font text-2xl text-white uppercase mb-6">Start a New Topic</h2>
              <form onSubmit={handleCreateThread} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Thread Title</label>
                  <input 
                    type="text" 
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Content</label>
                  <textarea 
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Start the conversation..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#fbbf24] transition-all outline-none min-h-[150px] resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!newThreadTitle.trim() || !newThreadContent.trim() || submitting}
                  className="w-full bg-[#fbbf24] text-[#1a2332] py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Launch Thread'}
                </button>
              </form>
            </div>
          ) : (
            <div className="grid gap-4">
              {threads.map(thread => (
                <button 
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all text-left group flex items-center gap-6"
                >
                  <div className="w-14 h-14 rounded-2xl border-2 border-[#fbbf24]/30 overflow-hidden bg-[#1a2332] shrink-0 flex items-center justify-center group-hover:border-[#fbbf24] transition-colors">
                    {thread.authorAvatarUrl ? (
                      <img src={thread.authorAvatarUrl} alt={thread.authorUsername} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={24} className="text-[#fbbf24]" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="comic-font text-xl text-white uppercase truncate group-hover:text-[#fbbf24] transition-colors">{thread.title}</h3>
                      {thread.replyCount > 10 && <Zap size={14} className="text-[#fbbf24] shrink-0" />}
                    </div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      By <span className="text-gray-300">{thread.authorUsername}</span> • {formatDistanceToNow(thread.createdAt)} ago
                    </p>
                  </div>

                  <div className="flex items-center gap-8 shrink-0">
                    <div className="text-center">
                      <p className="text-xl comic-font text-white">{thread.replyCount}</p>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Replies</p>
                    </div>
                    <ChevronRight className="text-gray-700 group-hover:text-[#fbbf24] transition-colors" size={20} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityThreadsPage;
