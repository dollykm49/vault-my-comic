
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Conversation, Message, User } from '../types';
import { Icons, COLORS } from '../constants';

interface MessagesPageProps {
  user: User;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [convs, users] = await Promise.all([
        storageService.getConversations(user.id),
        storageService.getAllProfiles()
      ]);
      
      const filteredUsers = users.filter(p => p.id !== user.id);
      setConversations(convs);
      setAllUsers(filteredUsers);

      // If redirected from marketplace with a userId
      if (targetUserId) {
        const targetUser = filteredUsers.find(u => u.id === targetUserId);
        if (targetUser) {
          setSelectedUser(targetUser);
        }
      } else if (convs.length > 0 && !selectedUser) {
        setSelectedUser(convs[0].otherUser);
      }
      
      setLoading(false);
    };
    
    init();
  }, [user, targetUserId]);

  useEffect(() => {
    if (selectedUser) {
      const unsubscribe = storageService.getMessages(user.id, selectedUser.id, (msgs) => {
        setMessages(msgs);
        storageService.markAsRead(user.id, selectedUser.id);
      });
      return () => unsubscribe();
    }
  }, [selectedUser, user.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    const data = await storageService.getConversations(user.id);
    setConversations(data);
    setLoading(false);
  };

  const loadAllUsers = async () => {
    const data = await storageService.getAllProfiles();
    setAllUsers(data.filter(p => p.id !== user.id));
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      await storageService.sendMessage(user.id, selectedUser.id, newMessage.trim());
      setNewMessage('');
      loadConversations();
    } catch (error) {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = allUsers.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-[#fbbf24] rounded-full animate-spin mb-4" />
        <p className="comic-font text-[#fbbf24] tracking-widest uppercase">Syncing Comm-Links...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl comic-font text-[#fbbf24] flex items-center gap-3">
            <Icons.MessageSquare className="h-8 w-8 text-[#dc2626]" />
            VAULT MESSAGES
          </h1>
          <p className="text-gray-400 mt-1">Chat with fellow collectors in the network.</p>
        </div>
        <button 
          onClick={() => setIsNewChatOpen(true)}
          className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2"
        >
          <Icons.Plus className="h-5 w-5" />
          New Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Links</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Icons.MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-tighter">No active chats</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.otherUser.id}
                  onClick={() => setSelectedUser(conv.otherUser)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 group ${
                    selectedUser?.id === conv.otherUser.id
                      ? 'bg-[#fbbf24] text-[#1a2332]'
                      : 'hover:bg-white/5 text-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-2 ${
                    selectedUser?.id === conv.otherUser.id ? 'border-[#1a2332]' : 'border-gray-700 bg-gray-800'
                  }`}>
                    {conv.otherUser.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} alt={conv.otherUser.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Icons.UserCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-black uppercase truncate text-sm`}>{conv.otherUser.username}</p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#dc2626] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate opacity-70`}>
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-800 border-2 border-[#fbbf24] flex items-center justify-center">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Icons.UserCircle className="h-6 w-6 text-[#fbbf24]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase tracking-wider">{selectedUser.username}</h3>
                    <p className="text-[10px] text-[#fbbf24] font-bold uppercase">{selectedUser.subscription?.replace(/_/g, ' ')} COLLECTOR</p>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-xl ${
                        msg.senderId === user.id
                          ? 'bg-[#dc2626] text-white rounded-tr-none'
                          : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                      }`}
                    >
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      <p className="text-[10px] opacity-50 mt-2 font-bold uppercase">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#fbbf24] transition-all"
                  />
                  <button 
                    onClick={handleSend} 
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#fbbf24] text-[#1a2332] p-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <Icons.Send className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center p-12">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-white/10">
                <Icons.MessageSquare className="h-10 w-10 opacity-30" />
              </div>
              <h3 className="text-2xl comic-font text-white uppercase mb-2">Select a Comm-Link</h3>
              <p className="max-w-xs text-sm">Choose a collector from your active links or start a new conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2332] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-slideUp">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl comic-font text-[#fbbf24]">NEW COLLECTOR CHAT</h2>
              <button onClick={() => setIsNewChatOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  placeholder="Search by hero identity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#fbbf24]"
                />
              </div>

              <div className="h-80 overflow-y-auto pr-2 space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 italic">No collectors found.</div>
                ) : (
                  filteredUsers.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setSelectedUser(profile);
                        setIsNewChatOpen(false);
                      }}
                      className="w-full p-4 rounded-2xl border border-white/5 hover:border-[#fbbf24] bg-white/5 hover:bg-white/10 transition-all text-left flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center border-2 border-gray-700 group-hover:border-[#fbbf24]">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Icons.UserCircle className="h-7 w-7 text-gray-500 group-hover:text-[#fbbf24]" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-white uppercase group-hover:text-[#fbbf24]">{profile.username}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          {profile.subscription?.replace(/_/g, ' ')} TIER
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
