'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiCalendar,
  FiUser,
  FiActivity,
  FiFilter,
  FiClock,
  FiBell,
} from 'react-icons/fi';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import toast from 'react-hot-toast';

interface LogEntry {
  id: number;
  user?: { id: number; name: string; email: string } | null;
  action: string;
  entity_type?: string;
  entity_id?: number;
  ip_address?: string;
  details?: string;
  created_at: string;
}

const actionLabels: Record<string, { label: string; className: string }> = {
  login: { label: 'Login', className: 'bg-blue-50 text-blue-700' },
  logout: { label: 'Logout', className: 'bg-gray-100 text-gray-600' },
  create: { label: 'Criação', className: 'bg-emerald-50 text-emerald-700' },
  update: { label: 'Atualização', className: 'bg-amber-50 text-amber-700' },
  delete: { label: 'Exclusão', className: 'bg-red-50 text-red-700' },
  enroll: { label: 'Matrícula', className: 'bg-violet-50 text-violet-700' },
  payment: { label: 'Pagamento', className: 'bg-green-50 text-green-700' },
  access: { label: 'Acesso', className: 'bg-cyan-50 text-cyan-700' },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUser, setSearchUser] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (searchUser) params.user = searchUser;
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const { data } = await api.get('/admin/logs', { params });
      setLogs(data.logs || data.data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 20));
    } catch {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [page, searchUser, actionFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [searchUser, actionFilter, startDate, endDate]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getActionStyle = (action: string) => {
    const key = action.toLowerCase().split('_')[0];
    return actionLabels[key]?.className || 'bg-gray-100 text-gray-600';
  };

  const getActionLabel = (action: string) => {
    const key = action.toLowerCase().split('_')[0];
    return actionLabels[key]?.label || action;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs de Acesso</h1>
        <p className="text-sm text-gray-500 mt-1">Monitore todas as atividades da plataforma</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuário..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiFilter /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ação</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Todas</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Criação</option>
                <option value="update">Atualização</option>
                <option value="delete">Exclusão</option>
                <option value="enroll">Matrícula</option>
                <option value="payment">Pagamento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            {(actionFilter || startDate || endDate) && (
              <div className="flex items-end">
                <button
                  onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); }}
                  className="px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <Loading fullScreen={false} text="Carregando logs..." />
      ) : logs.length === 0 ? (
        <EmptyState icon={<FiBell />} title="Nenhum log encontrado" description="Ajuste os filtros para ver registros." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    <span className="flex items-center gap-1"><FiClock className="text-xs" /> Data/Hora</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    <span className="flex items-center gap-1"><FiUser className="text-xs" /> Usuário</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    <span className="flex items-center gap-1"><FiActivity className="text-xs" /> Ação</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Entidade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">IP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{log.user.name}</p>
                          <p className="text-xs text-gray-400">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getActionStyle(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                      {log.entity_type && (
                        <span>
                          {log.entity_type}
                          {log.entity_id && <span className="text-gray-400"> #{log.entity_id}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono hidden lg:table-cell">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate hidden lg:table-cell">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
