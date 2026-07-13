'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

interface CalendarEvent {
  id: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  module_title: string | null;
  title: string;
  start_date: string;
  end_date: string;
  duration_days: number | null;
  alert_status: 'active' | 'warning' | 'expired';
  hours_remaining: number;
  status: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  course_title: string | null;
  is_read: number;
  created_at: string;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const statusLabels: Record<string, string> = {
  active: 'No prazo',
  warning: 'Atenção: 24h para encerrar!',
  expired: 'Encerrado',
};

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [calRes, notifRes] = await Promise.allSettled([
        api.get('/course-durations/student'),
        api.get('/course-durations/notifications'),
      ]);

      if (calRes.status === 'fulfilled') {
        setEvents(calRes.value.data || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data.notifications || []);
        setUnreadCount(notifRes.value.data.unread_count || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/course-durations/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/course-durations/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('Todas notificações marcadas como lidas');
    } catch {
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return events.filter(e => {
      const start = new Date(e.start_date);
      const end = new Date(e.end_date);
      const check = new Date(year, month, day);
      return check >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             check <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const today = new Date();

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Loading text="Carregando calendário..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe os prazos dos seus cursos</p>
        </div>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <FiBell />
          Notificações
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Alertas de prazo */}
      {events.some(e => e.alert_status === 'warning') && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Atenção: Prazos próximos!</p>
              {events.filter(e => e.alert_status === 'warning').map(e => (
                <p key={e.id} className="text-sm text-yellow-700 mt-1">
                  <strong>{e.course_title}</strong> — {e.title}: encerra em {Math.max(0, Math.round(e.hours_remaining))}h
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notificações dropdown */}
      {showNotifications && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">Nenhuma notificação</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                    n.is_read ? 'bg-white' : 'bg-primary-50/50'
                  }`}
                >
                  <div className={`shrink-0 mt-0.5 ${n.type === 'deadline_24h' ? 'text-yellow-500' : n.type === 'deadline_expired' ? 'text-red-500' : 'text-primary-500'}`}>
                    {n.type === 'deadline_24h' ? <FiAlertTriangle /> : n.type === 'deadline_expired' ? <FiXCircle /> : <FiBell />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                    {n.course_title && <p className="text-xs text-primary-500 mt-0.5">{n.course_title}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-2" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiChevronLeft className="text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiChevronRight className="text-gray-600" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 sm:h-24" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                    className={`h-20 sm:h-24 p-1.5 rounded-lg border cursor-pointer transition-all ${
                      isToday ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-gray-300'
                    } ${selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth() ? 'ring-2 ring-primary-400' : ''}`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>{day}</p>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                            e.alert_status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            e.alert_status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-gray-500">+{dayEvents.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Detalhes e Próximos Prazos */}
        <div className="space-y-4">
          {/* Detalhes do dia selecionado */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-3">
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum evento neste dia.</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDay(selectedDate.getDate()).map(e => {
                    const colors = statusColors[e.alert_status] || statusColors.active;
                    return (
                      <div key={e.id} className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                        <p className={`text-sm font-semibold ${colors.text}`}>{e.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{e.course_title}</p>
                        {e.module_title && <p className="text-xs text-gray-500">{e.module_title}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <FiClock className="text-xs text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(e.start_date)} — {formatDate(e.end_date)}
                          </span>
                        </div>
                        <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {statusLabels[e.alert_status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Próximos prazos */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FiCalendar className="text-primary-500" />
              Próximos Prazos
            </h3>
            {events.filter(e => e.alert_status !== 'expired').length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum prazo próximo.</p>
            ) : (
              <div className="space-y-3">
                {events.filter(e => e.alert_status !== 'expired').slice(0, 5).map(e => {
                  const colors = statusColors[e.alert_status] || statusColors.active;
                  return (
                    <Link
                      key={e.id}
                      href={`/aluno/curso/${e.course_slug}`}
                      className={`block p-3 rounded-xl border ${colors.border} hover:shadow-md transition-shadow`}
                    >
                      <p className={`text-sm font-semibold ${colors.text}`}>{e.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{e.course_title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <FiClock className="text-xs text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {e.alert_status === 'warning'
                            ? `${Math.max(0, Math.round(e.hours_remaining))}h restantes`
                            : `Encerra em ${formatDate(e.end_date)}`
                          }
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-3">Legenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-green-400" />
                <span className="text-xs text-gray-600">No prazo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-yellow-400" />
                <span className="text-xs text-gray-600">Atenção: 24h para encerrar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-red-400" />
                <span className="text-xs text-gray-600">Encerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
