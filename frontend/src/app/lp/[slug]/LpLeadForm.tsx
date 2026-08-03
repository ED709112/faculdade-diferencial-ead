'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function LpLeadForm({ courseTitle }: { courseTitle: string }) {
  const [form, setForm] = useState({ name: '', whatsapp: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const formatPhone = (v: string) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

  const getSource = () => {
    if (typeof window === 'undefined') return 'lp-curso';
    return new URLSearchParams(window.location.search).get('src') || 'lp-curso';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Digite seu nome');
    setSending(true);
    try {
      await api.post('/crm/public-leads', {
        name: form.name,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        phone: form.whatsapp.replace(/\D/g, ''),
        course_interest: courseTitle,
        source: getSource(),
      });
      setSent(true);
      toast.success('Recebemos seu interesse! Entraremos em contato.');
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaWhatsapp className="text-4xl text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Obrigado pelo Interesse!</h3>
        <p className="text-gray-500">Recebemos seus dados. Nossa equipe entrará em contato em breve pelo WhatsApp.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-secondary-400"
          placeholder="Digite seu nome completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
        <input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: formatPhone(e.target.value)})}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-secondary-400"
          placeholder="(86) 99999-9999" />
      </div>
      <button type="submit" disabled={sending || !form.name.trim()}
        className="w-full py-3 bg-gradient-to-r from-secondary-500 to-primary-500 text-white rounded-xl font-semibold hover:from-secondary-600 hover:to-primary-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base">
        {sending ? 'Enviando...' : <><FaWhatsapp className="text-lg" /> Quero receber informações</>}
      </button>
      <p className="text-xs text-center text-gray-400">Seus dados estão protegidos. Não compartilhamos com terceiros.</p>
    </form>
  );
}
