'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaGraduationCap } from 'react-icons/fa';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '@/lib/api';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao enviar e-mail. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <FaGraduationCap className="text-primary-500 text-4xl" />
            <span className="text-2xl font-bold text-gray-900">
              Faculdade Diferencial <span className="text-primary-500">EAD</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {sent ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheckCircle className="text-3xl text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">E-mail enviado!</h1>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Enviamos um link de recuperacao de senha para{' '}
                <strong className="text-gray-700">{email}</strong>. Verifique sua caixa de entrada
                e siga as instrucoes.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-semibold text-sm"
              >
                <FiArrowLeft />
                Voltar para o login
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar senha</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Informe o e-mail associado a sua conta e enviaremos um link para redefinir sua
                  senha.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="label">
                    E-mail
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="input-field pl-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-center !py-3.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner !w-5 !h-5 !border-2" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  <FiArrowLeft />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
