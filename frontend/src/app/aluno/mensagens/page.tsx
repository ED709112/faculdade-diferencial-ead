'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiMessageSquare,
  FiSend,
  FiSearch,
  FiArrowLeft,
  FiCircle,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  role?: string;
}

interface Message {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  is_read: number;
}

interface Conversation {
  id: number;
  course_id?: number;
  other_participants: Participant[];
  last_message?: Message;
  unread_count: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const {
    joinConversation, leaveConversation,
    onNewMessage, onTyping, isConnected,
  } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<Participant[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations || data.data || data);
    } catch {
      // silently fail
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      setLoadingMessages(true);
      const { data } = await api.get(`/messages/${conversationId}`);
      setMessages(data.messages || data.data || data);
    } catch {
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users?role=teacher,admin&limit=50');
      setUsers(data.users || data.data || data || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      joinConversation(activeConversation.id);
      return () => { leaveConversation(activeConversation.id); };
    }
  }, [activeConversation, fetchMessages, joinConversation, leaveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const cleanup = onNewMessage((msg: any) => {
      if (activeConversation && msg.conversation_id === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversation_id
            ? { ...c, last_message: msg, unread_count: activeConversation?.id === msg.conversation_id ? 0 : (c.unread_count || 0) + 1 }
            : c
        )
      );
    });
    return cleanup;
  }, [activeConversation, onNewMessage]);

  useEffect(() => {
    const cleanup = onTyping((data: { userId: number; conversationId: number }) => {
      if (activeConversation && data.conversationId === activeConversation.id && data.userId !== user?.id) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
        }, 3000);
      }
    });
    return cleanup;
  }, [activeConversation, onTyping, user?.id]);

  const selectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowMobileList(false);
    setMessages([]);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
  };

  const sendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;
    try {
      setSending(true);
      const { data } = await api.post('/messages', {
        conversation_id: activeConversation.id,
        message: newMessage.trim(),
      });
      const sentMsg = data.message || data;
      setMessages((prev) => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, last_message: sentMsg }
            : c
        )
      );
      setNewMessage('');
      inputRef.current?.focus();
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async (targetUser: Participant) => {
    try {
      const { data } = await api.post('/messages/conversation', {
        participant_ids: [targetUser.id],
      });
      const conv = data.conversation || data;
      if (conv) {
        await fetchConversations();
        setShowNewChat(false);
        setUserSearch('');
        const newConv = conversations.find(c => c.id === conv.id) || { ...conv, other_participants: [targetUser], unread_count: 0, last_message: undefined };
        selectConversation(newConv);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar conversa');
    }
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.other_participants?.find((p) => p.id !== user?.id) || conv.other_participants?.[0];

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) return 'Hoje';
    if (diff < 172800000) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) && u.id !== user?.id
  );

  if (loadingConversations) return <Loading text="Carregando mensagens..." />;

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 lg:-m-6 bg-white dark:bg-gray-800 rounded-none lg:rounded-xl lg:overflow-hidden lg:shadow-sm">
      {/* Conversation List */}
      <div className={`w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 ${showMobileList ? 'flex' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Mensagens</h3>
            <button onClick={() => { setShowNewChat(true); fetchUsers(); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-500">
              <FiPlus className="text-lg" />
            </button>
          </div>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400 dark:text-gray-500 mr-2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversa..." className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            <div>
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <button onClick={() => { setShowNewChat(false); setUserSearch(''); }} className="p-1 hover:bg-gray-100 rounded-lg"><FiX className="text-sm" /></button>
                <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar professor..." className="bg-transparent border-none outline-none text-sm w-full" autoFocus />
              </div>
              {filteredUsers.map((u) => (
                <button key={u.id} onClick={() => startNewConversation(u)} className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary-500">{u.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.role === 'teacher' ? 'Professor' : 'Administrador'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">Nenhuma conversa encontrada</p>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConversation?.id === conv.id;
              return (
                <button key={conv.id} onClick={() => selectConversation(conv)} className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-b border-gray-50 dark:border-gray-700/50 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {other?.avatar ? <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" /> : <span className="text-sm font-semibold text-primary-500">{other?.name?.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{other?.name}</p>
                      {conv.last_message && <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{formatDate(conv.last_message.created_at)}</span>}
                    </div>
                    {conv.last_message && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{conv.last_message.message}</p>}
                  </div>
                  {conv.unread_count > 0 && <span className="w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{conv.unread_count > 9 ? '9+' : conv.unread_count}</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobileList ? 'hidden lg:flex' : 'flex'}`}>
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <FiMessageSquare className="text-3xl text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Selecione uma conversa</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escolha uma conversa ao lado ou inicie uma nova</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowMobileList(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><FiArrowLeft /></button>
              {(() => {
                const other = getOtherParticipant(activeConversation);
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {other?.avatar ? <img src={other.avatar} alt={other.name} className="w-full h-full object-cover" /> : <span className="text-sm font-semibold text-primary-500">{other?.name?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{other?.name}</p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <FiCircle className="text-[6px] fill-current" />
                        {isConnected ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <Loading fullScreen={false} text="Carregando..." />
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-primary-500 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUsers.size > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 italic pl-2">digitando...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Digite sua mensagem..." className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 transition-colors">
                  <FiSend />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
