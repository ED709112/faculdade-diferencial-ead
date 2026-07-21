'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FiMessageSquare,
  FiSend,
  FiSearch,
  FiArrowLeft,
  FiCircle,
} from 'react-icons/fi';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Participant {
  id: number;
  name: string;
  avatar?: string;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: number;
  participants: Participant[];
  last_message?: Message;
  unread_count: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
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
      const { data } = await api.get(`/messages/conversations/${conversationId}`);
      setMessages(data.messages || data.data || data);
    } catch {
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowMobileList(false);
    setMessages([]);
    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
  };

  const sendMessage = async () => {
    if (!activeConversation || !newMessage.trim()) return;
    try {
      setSending(true);
      const { data } = await api.post(`/messages/conversations/${activeConversation.id}`, {
        content: newMessage.trim(),
      });
      const sentMsg = data.message || data;
      setMessages((prev) => [...prev, sentMsg]);
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

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

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

  if (loadingConversations) return <Loading text="Carregando mensagens..." />;

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 lg:-m-6 bg-white dark:bg-gray-800 rounded-none lg:rounded-xl lg:overflow-hidden lg:shadow-sm">
      {/* Conversation List */}
      <div
        className={`w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 ${
          showMobileList ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Mensagens</h3>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400 dark:text-gray-500 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Nenhuma conversa encontrada
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-b border-gray-50 dark:border-gray-700/50 ${
                    isActive
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {other?.avatar ? (
                      <img
                        src={other.avatar}
                        alt={other.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary-500">
                        {other?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {other?.name}
                      </p>
                      {conv.last_message && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {formatDate(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          showMobileList ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <FiMessageSquare className="text-3xl text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Selecione uma conversa
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Escolha uma conversa ao lado para começar a mensagem
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowMobileList(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <FiArrowLeft />
              </button>
              {(() => {
                const other = getOtherParticipant(activeConversation);
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {other?.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary-500">
                          {other?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{other?.name}</p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <FiCircle className="text-[6px] fill-current" /> Online
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <Loading fullScreen={false} text="Carregando..." />
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMe
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isMe ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Form */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="input-field"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="btn-primary px-5 py-3 flex items-center gap-2"
                >
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
