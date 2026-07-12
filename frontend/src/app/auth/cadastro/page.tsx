'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FaGraduationCap } from 'react-icons/fa';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi';

export default function CadastroPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (!lgpdConsent) {
      setError('Voce precisa aceitar a Politica de Privacidade para continuar.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, phone: phone || undefined, lgpd_consent: lgpdConsent });
    } catch {
      // toast already handled in useAuth
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Crie sua conta</h1>
            <p className="text-gray-500 text-sm">
              Comece sua jornada de aprendizado agora mesmo.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Nome completo
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="input-field pl-11"
                />
              </div>
            </div>

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

            <div>
              <label htmlFor="phone" className="label">
                Telefone <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caracteres"
                  required
                  minLength={8}
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmar senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* LGPD */}
            <label className="flex items-start gap-3 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 shrink-0"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Li e aceito a{' '}
                <Link href="/privacidade" className="text-primary-500 hover:underline font-medium">
                  Politica de Privacidade
                </Link>{' '}
                e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-center !py-3.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner !w-5 !h-5 !border-2" />
                  Cadastrando...
                </span>
              ) : (
                'Cadastrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Ja tem conta?{' '}
              <Link
                href="/auth/login"
                className="text-primary-500 hover:text-primary-600 font-semibold"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
