
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, Phone, Mail, User as UserIcon, Clock } from 'lucide-react';
import { db } from '../services/db';
import { Ticket, User } from '../types';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Ticket | null>(null);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Initialize and Poll
  useEffect(() => {
    // 1. Check if user is logged in
    const currentUser = db.getCurrentUser();
    setUser(currentUser);

    // 2. Check for active chat (logged in OR guest)
    checkActiveChat(currentUser);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
        checkActiveChat(currentUser);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
      if (isOpen && activeChat) {
          scrollToBottom();
      }
  }, [activeChat?.messages?.length, isOpen]);

  const checkActiveChat = (currentUser?: User) => {
      const tickets = db.getTickets();
      
      let chat: Ticket | undefined;

      if (currentUser) {
          // Find chat for logged-in user
          chat = tickets.find(t => 
              t.userId === currentUser.id && 
              t.type === 'chat' && 
              t.status !== 'closed'
          );
      } else {
          // Find chat for Guest (stored in localStorage)
          const guestId = localStorage.getItem('modus_guest_id');
          if (guestId) {
             chat = tickets.find(t => 
                 t.userId === guestId && 
                 t.type === 'chat' && 
                 t.status !== 'closed'
             );
          }
      }

      if (chat) {
          setActiveChat(chat);
      }
  };

  const scrollToBottom = () => {
      setTimeout(() => {
          messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
  };

  const handleStartChat = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName || !formEmail) return;

      // Generate Guest ID if not logged in
      let userId = user?.id;
      if (!userId) {
          let storedGuestId = localStorage.getItem('modus_guest_id');
          if (!storedGuestId) {
              storedGuestId = `guest_${Date.now().toString().slice(-6)}`;
              localStorage.setItem('modus_guest_id', storedGuestId);
          }
          userId = storedGuestId;
      }

      // Create new chat session
      const newChat: Ticket = {
          id: `C-${Date.now().toString().slice(-4)}`,
          type: 'chat',
          userId: userId,
          userName: formName, // Use form name even if logged in for consistency in this flow
          guestEmail: formEmail,
          guestPhone: formPhone,
          subject: 'Live Chat Session',
          status: 'open',
          priority: 'medium',
          date: new Date().toLocaleDateString(),
          lastMessage: 'Chat started',
          unread: false,
          messages: [{
              id: `m-${Date.now()}`,
              sender: user ? 'user' : 'guest',
              text: `Chat started by ${formName}.`,
              date: new Date().toLocaleString()
          }]
      };

      db.createTicket(newChat);
      setActiveChat(newChat);
      setMessageInput('');
  };

  const handleSendMessage = () => {
      if (!messageInput.trim() || !activeChat) return;

      const sender = user ? 'user' : 'guest';
      db.replyToTicket(activeChat.id, messageInput, sender);
      
      // Update local state immediately for responsiveness
      const updatedChat = db.getTicketById(activeChat.id);
      setActiveChat(updatedChat || null);
      
      setMessageInput('');
      scrollToBottom();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
        {/* Chat Window */}
        {isOpen && (
            <div className="mb-4 w-96 max-w-[calc(100vw-48px)] h-[600px] max-h-[80vh] bg-white shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                
                {/* Header */}
                <div className="bg-black text-white p-5 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-[#ff4d00] rounded-full animate-pulse"></div> 
                            <span className="text-xs font-black uppercase tracking-widest text-[#ff4d00]">Live Support</span>
                        </div>
                        <h3 className="text-lg font-bold">Traffic Creator</h3>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="relative z-10 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                    {/* Abstract bg element */}
                    <div className="absolute -right-6 -bottom-10 w-24 h-24 bg-[#ff4d00] opacity-20 rounded-full blur-xl"></div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col bg-[#f9fafb]">
                    
                    {!activeChat ? (
                        // --- PRE-CHAT FORM ---
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-6 text-center">
                                <h4 className="text-xl font-bold text-gray-900 mb-2">How can we help?</h4>
                                <p className="text-xs text-gray-500">We typically reply within <span className="font-bold text-gray-900">5 minutes</span>.</p>
                            </div>

                            <form onSubmit={handleStartChat} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name <span className="text-[#ff4d00]">*</span></label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            required
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-3 pl-10 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Email Address <span className="text-[#ff4d00]">*</span></label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            required
                                            type="email"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-3 pl-10 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-2">Phone Number (Optional)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input 
                                            type="tel"
                                            value={formPhone}
                                            onChange={(e) => setFormPhone(e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-3 pl-10 text-sm font-medium outline-none focus:border-[#ff4d00]"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-black text-white p-4 text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d00] transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                    Start Chat <Send size={14} />
                                </button>
                            </form>
                            
                            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                                <p className="text-[10px] text-gray-400">By chatting you agree to our Privacy Policy.</p>
                            </div>
                        </div>
                    ) : (
                        // --- ACTIVE CHAT ---
                        <>
                             {/* System Notice */}
                            <div className="bg-gray-100 p-3 text-center border-b border-gray-200">
                                <p className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
                                    <Clock size={12} /> Support will respond within, normally, 5 minutes.
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {activeChat.messages?.map((msg) => {
                                    const isMe = msg.sender === 'user' || msg.sender === 'guest';
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`p-3 text-sm shadow-sm ${
                                                    isMe 
                                                        ? 'bg-black text-white rounded-l-lg rounded-tr-lg' 
                                                        : 'bg-white text-gray-900 border border-gray-200 rounded-r-lg rounded-tl-lg'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                                <span className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wide">
                                                    {isMe ? 'You' : 'Support'} • {msg.date.split(',')[1]?.trim() || 'Now'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={el => setMessagesEndRef(el)} />
                            </div>

                             {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <input 
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="flex-1 bg-white border border-gray-200 p-3 text-sm outline-none focus:border-[#ff4d00] transition-colors"
                                        placeholder="Type a message..."
                                        autoFocus
                                    />
                                    <button 
                                        className="p-3 bg-[#ff4d00] text-white hover:bg-black transition-colors" 
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* Floating Button */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`${isOpen ? 'bg-black scale-90' : 'bg-[#ff4d00] hover:scale-110'} text-white p-4 shadow-[0_10px_20px_rgba(255,77,0,0.3)] transition-all duration-300 rounded-full flex items-center justify-center z-[100]`}
        >
            {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
    </div>
  );
};

export default ChatWidget;