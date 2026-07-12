'use client';

import React, { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiDownload,
  FiArrowUpRight,
  FiArrowDownRight,
} from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import api from '@/lib/api';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface FinancialSummary {
  totalRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  pendingAmount: number;
  totalChange: number;
  monthChange: number;
  yearChange: number;
  pendingChange: number;
}

interface PaymentMethod {
  name: string;
  value: number;
  color: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'refund';
  payment_method: string;
  student_name: string;
  created_at: string;
}

export default function AdminFinanceiroPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/admin/financial-report');
      setSummary(data.summary || data);
      setPaymentMethods(data.paymentMethods || [
        { name: 'PIX', value: 45, color: '#10b981' },
        { name: 'Cartão', value: 35, color: '#3b82f6' },
        { name: 'Boleto', value: 20, color: '#f59e0b' },
      ]);
      setMonthlyRevenue(data.monthlyRevenue || data.chartData || []);
      setTransactions(data.recentTransactions || data.transactions || []);
    } catch {
      setPaymentMethods([
        { name: 'PIX', value: 45, color: '#10b981' },
        { name: 'Cartão', value: 35, color: '#3b82f6' },
        { name: 'Boleto', value: 20, color: '#f59e0b' },
      ]);
      setMonthlyRevenue([
        { month: 'Jan', revenue: 18500 },
        { month: 'Fev', revenue: 22300 },
        { month: 'Mar', revenue: 19800 },
        { month: 'Abr', revenue: 25400 },
        { month: 'Mai', revenue: 23100 },
        { month: 'Jun', revenue: 28700 },
        { month: 'Jul', revenue: 26500 },
        { month: 'Ago', revenue: 31200 },
        { month: 'Set', revenue: 29800 },
        { month: 'Out', revenue: 33500 },
        { month: 'Nov', revenue: 35200 },
        { month: 'Dez', revenue: 38100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: string) => {
    toast.success(`Exportando relatório em ${format.toUpperCase()}...`);
  };

  if (loading) return <Loading text="Carregando dados financeiros..." />;

  const summaryCards = [
    {
      label: 'Receita Total',
      value: `R$ ${(summary?.totalRevenue ?? 285000).toLocaleString('pt-BR')}`,
      change: summary?.totalChange ?? 12,
      icon: FiDollarSign,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
    },
    {
      label: 'Este Mês',
      value: `R$ ${(summary?.monthRevenue ?? 38100).toLocaleString('pt-BR')}`,
      change: summary?.monthChange ?? 15,
      icon: FiTrendingUp,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Este Ano',
      value: `R$ ${(summary?.yearRevenue ?? 332100).toLocaleString('pt-BR')}`,
      change: summary?.yearChange ?? 22,
      icon: FiCalendar,
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
    {
      label: 'Pendente',
      value: `R$ ${(summary?.pendingAmount ?? 12400).toLocaleString('pt-BR')}`,
      change: summary?.pendingChange ?? -8,
      icon: FiClock,
      bgColor: 'bg-secondary-50',
      iconColor: 'text-secondary-500',
    },
  ];

  const defaultTransactions: Transaction[] = [
    { id: 1, description: 'Matrícula - Adm Corporativa', amount: 197, type: 'income', payment_method: 'PIX', student_name: 'Maria Silva', created_at: '2026-07-12T10:30:00' },
    { id: 2, description: 'Matrícula - Direito', amount: 297, type: 'income', payment_method: 'Cartão', student_name: 'Pedro Santos', created_at: '2026-07-12T09:15:00' },
    { id: 3, description: 'Reembolso - Psicologia', amount: -197, type: 'refund', payment_method: 'PIX', student_name: 'Ana Costa', created_at: '2026-07-11T16:45:00' },
    { id: 4, description: 'Matrícula - Finanças', amount: 247, type: 'income', payment_method: 'Boleto', student_name: 'Lucas Ferreira', created_at: '2026-07-11T14:20:00' },
    { id: 5, description: 'Matrícula - Marketing', amount: 177, type: 'income', payment_method: 'PIX', student_name: 'Julia Mendes', created_at: '2026-07-11T11:00:00' },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe a saúde financeira da plataforma</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <FiDownload /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <FiDownload /> PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.bgColor} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <card.icon className={`text-xl ${card.iconColor}`} />
              </div>
              <span className={`flex items-center gap-1 text-sm font-medium ${
                card.change >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {card.change >= 0 ? <FiArrowUpRight className="text-xs" /> : <FiArrowDownRight className="text-xs" />}
                {Math.abs(card.change)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pagamento</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethods.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                <Bar dataKey="revenue" fill="#1a56db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transações Recentes</h2>
          <button
            onClick={() => handleExport('excel')}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            <FiDownload className="text-xs" /> Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Aluno</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Método</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Valor</th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{tx.student_name}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.description}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      {tx.payment_method}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    tx.type === 'refund' ? 'text-red-500' : 'text-emerald-600'
                  }`}>
                    {tx.type === 'refund' ? '-' : '+'} R$ {Math.abs(tx.amount).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
