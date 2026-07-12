'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FaGraduationCap } from 'react-icons/fa';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h1>
            <p className="text-gray-500 text-sm">
              Entre com suas credenciais para acessar sua conta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Sua senha"
                  required
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

            <div className="flex items-center justify-end">
              <Link
                href="/auth/recuperar-senha"
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-center !py-3.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner !w-5 !h-5 !border-2" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Nao tem conta?{' '}
              <Link
                href="/auth/cadastro"
                className="text-primary-500 hover:text-primary-600 font-semibold"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao entrar, voce concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-gray-600">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-gray-600">
            Politica de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
