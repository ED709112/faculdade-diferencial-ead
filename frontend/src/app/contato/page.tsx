'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiSend,
  FiPaperclip,
  FiCheck,
} from 'react-icons/fi';
import PublicLayout from '@/components/layout/PublicLayout';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ContatoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Preencha nome, e-mail e mensagem.');
      return;
    }
    setSending(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('message', formData.message);
      if (file) payload.append('attachment', file);

      await api.post('/contact', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Mensagem enviada com sucesso!');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setFile(null);
    } catch {
      toast.error('Erro ao enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-600 to-primary-500">
        <div className="container-custom py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Fale Conosco
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 leading-relaxed">
              Estamos à disposição para atender você. Envie sua mensagem ou encontre nossos canais de contato.
            </p>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500" />
      </section>

      {/* Contact Cards */}
      <section className="py-10 lg:py-14 bg-secondary-50 dark:bg-secondary-900/20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiMapPin className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Endereço</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Rua João da Cruz Monteiro, 1728<br />
                Cristo Rei, Teresina - PI<br />
                CEP 64.014-210
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiPhone className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Telefone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                (86) 99937-3900<br />
                <span className="text-gray-400 dark:text-gray-500">Seg - Sex: 8h às 18h</span>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <FiMail className="text-2xl text-primary-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">E-mail</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                contato@faculdadediferencial.edu.br
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map + Form */}
      <section className="pb-10 lg:pb-14">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FiMapPin className="text-primary-500" />
                  Nossa Localização
                </h3>
              </div>
              <iframe
                src="https://www.google.com/maps?q=Rua+Jo%C3%A3o+da+Cruz+Monteiro,+1728,+Cristo+Rei,+Teresina+-+PI,+64.014-210&output=embed"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
                <FiSend className="text-primary-500" />
                Envie uma Mensagem
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">E-mail *</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Mensagem *</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="Escreva sua mensagem aqui..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Anexo</label>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                    <FiPaperclip className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {file ? file.name : 'Clique para anexar um arquivo'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {file && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                      <FiCheck />
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-600 ml-auto text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
