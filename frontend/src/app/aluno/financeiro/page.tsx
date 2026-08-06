'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiCreditCard, FiCheckCircle, FiClock, FiXCircle, FiDollarSign,
  FiTrendingUp, FiAlertTriangle, FiCopy, FiCheck, FiFileText, FiEye,
} from 'react-icons/fi';
import api from '@/lib/api';
import EmptyState from '@/components/ui/EmptyState';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  order_id: number;
  payment_method: string;
  amount: number;
  status: string;
  gateway: string;
  boleto_url: string | null;
  boleto_barcode: string | null;
  pix_copy_paste: string | null;
  pix_qr_code_base64: string | null;
  pix_expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  course_id: number;
  course_title: string;
  course_image: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_gateway: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  payments: Payment[];
}

interface FinancialData {
  summary: {
    total_paid: number;
    total_open: number;
    count_paid: number;
    count_open: number;
    count_overdue: number;
    count_cancelled: number;
  };
  orders: Order[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
  free: 'Gratuito',
};

const ORDER_STATUS: Record<string, { label: string; classes: string }> = {
  paid: { label: 'Pago', classes: 'bg-green-50 text-green-700' },
  pending: { label: 'Aguardando pagamento', classes: 'bg-yellow-50 text-yellow-700' },
  processing: { label: 'Processando', classes: 'bg-blue-50 text-blue-700' },
  failed: { label: 'Falhou', classes: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelado', classes: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'Reembolsado', classes: 'bg-purple-50 text-purple-700' },
  partial_refund: { label: 'Reembolso parcial', classes: 'bg-purple-50 text-purple-700' },
};

const PAYMENT_STATUS: Record<string, { label: string; classes: string }> = {
  approved: { label: 'Aprovado', classes: 'bg-green-50 text-green-700' },
  pending: { label: 'Pendente', classes: 'bg-yellow-50 text-yellow-700' },
  processing: { label: 'Processando', classes: 'bg-blue-50 text-blue-700' },
  declined: { label: 'Recusado', classes: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelado', classes: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'Reembolsado', classes: 'bg-purple-50 text-purple-700' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(map: Record<string, { label: string; classes: string }>, status: string) {
  const info = map[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${info.classes}`}>
      {info.label}
    </span>
  );
}

export default function AlunoFinanceiroPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showPixId, setShowPixId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/financial');
      setData(data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyPix = async (paymentId: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(paymentId);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Não foi possível copiar o código.');
    }
  };

  if (loading) return <Loading text="Carregando sua situação financeira..." />;

  if (!data) {
    return (
      <EmptyState
        icon={<FiCreditCard />}
        title="Não foi possível carregar os dados financeiros"
        description="Tente novamente em instantes."
      />
    );
  }

  const { summary } = data;
  const hasPending = data.orders.some(o => ['pending', 'processing'].includes(o.status));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Minhas Finanças</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Acompanhe seus pagamentos, boletos e Pix em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <FiCheckCircle className="text-lg" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total pago</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.total_paid)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.count_paid} pedido(s) pagos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <FiClock className="text-lg" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Em aberto</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summary.total_open)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary.count_open} pedido(s) pendente(s)</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <FiAlertTriangle className="text-lg" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Vencidos</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.count_overdue}</p>
          <p className="text-xs text-gray-400 mt-1">Pagamentos com vencimento passado</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <FiTrendingUp className="text-lg" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Total de pedidos</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.orders.length}</p>
          <p className="text-xs text-gray-400 mt-1">Na sua conta</p>
        </div>
      </div>

      {hasPending && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Você possui pagamentos em aberto. Para liberar sua matrícula, finalize o pagamento dos pedidos abaixo.
          </p>
        </div>
      )}

      {data.orders.length === 0 ? (
        <EmptyState
          icon={<FiCreditCard />}
          title="Nenhuma movimentação financeira"
          description="Quando você fizer uma compra ou matrícula, seus pagamentos aparecerão aqui."
          action={{ label: 'Ver Loja', href: '/aluno/loja' }}
        />
      ) : (
        <div className="space-y-4">
          {data.orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-start gap-3">
                  {order.course_image ? (
                    <img
                      src={order.course_image}
                      alt={order.course_title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                      <FiDollarSign className="text-xl text-primary-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{order.course_title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.order_number} · {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} · {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(Number(order.total_amount))}
                  </p>
                  {statusBadge(ORDER_STATUS, order.status)}
                </div>
              </div>

              {order.payments.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 divide-y divide-gray-100 dark:divide-gray-700">
                  {order.payments.map(payment => (
                    <div key={payment.id} className="px-5 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FiCreditCard className="text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                          {' '}
                          <span className="text-gray-400">·</span>{' '}
                          {formatCurrency(Number(payment.amount))}
                        </span>
                        {statusBadge(PAYMENT_STATUS, payment.status)}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {payment.status === 'pending' && payment.boleto_url && (
                          <a
                            href={payment.boleto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
                          >
                            <FiFileText /> Baixar boleto
                          </a>
                        )}
                        {payment.status === 'pending' && payment.pix_copy_paste && (
                          <button
                            type="button"
                            onClick={() => copyPix(payment.id, payment.pix_copy_paste!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
                          >
                            {copiedId === payment.id ? <FiCheck /> : <FiCopy />}
                            {copiedId === payment.id ? 'Copiado!' : 'Copiar código Pix'}
                          </button>
                        )}
                        {payment.status === 'pending' && (payment.pix_qr_code_base64 || payment.pix_copy_paste) && (
                          <button
                            type="button"
                            onClick={() => setShowPixId(showPixId === payment.id ? null : payment.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 border border-primary-200 dark:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-colors"
                          >
                            <FiEye /> {showPixId === payment.id ? 'Ocultar Pix' : 'Ver Pix'}
                          </button>
                        )}
                        {payment.paid_at && (
                          <span className="text-xs text-green-600">Pago em {formatDate(payment.paid_at)}</span>
                        )}
                      </div>

                      {showPixId === payment.id && payment.pix_qr_code_base64 && (
                        <div className="flex items-center gap-4 lg:w-full mt-2">
                          <img
                            src={`data:image/png;base64,${payment.pix_qr_code_base64}`}
                            alt="QR Code Pix"
                            className="w-36 h-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-1"
                          />
                          {payment.pix_copy_paste && (
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código Pix copia e cola</p>
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-700 dark:text-gray-300 break-all max-h-24 overflow-y-auto">
                                {payment.pix_copy_paste}
                              </div>
                              <button
                                type="button"
                                onClick={() => copyPix(payment.id, payment.pix_copy_paste!)}
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                              >
                                {copiedId === payment.id ? <FiCheck /> : <FiCopy />}
                                {copiedId === payment.id ? 'Copiado!' : 'Copiar código'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
