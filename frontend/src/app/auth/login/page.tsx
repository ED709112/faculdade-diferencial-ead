'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header com logo */}
      <header className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <Link href="/" className="inline-flex items-center">
            <img src="/images/logo.jpg" alt="Faculdade Diferencial EAD" className="h-10 lg:h-12 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex">
        {/* Lado esquerdo - Imagem */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <img
            src="/images/login-bg.jpg"
            alt="Educação"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10">
            <p className="text-white text-2xl font-bold leading-relaxed">
              Acesse seus cursos, acompanhe seu progresso e conquiste seu certificado.
            </p>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h1>
              <p className="text-gray-500">
                Entre com suas credenciais para acessar sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">E-mail</label>
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
                <label htmlFor="password" className="label">Senha</label>
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
                <Link href="/auth/recuperar-senha" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary-500 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-secondary-600 transition-colors shadow-lg shadow-secondary-500/25 disabled:opacity-50"
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
                <Link href="/auth/cadastro" className="text-primary-500 hover:text-primary-600 font-semibold">
                  Cadastre-se
                </Link>
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              Ao entrar, voce concorda com nossos{' '}
              <Link href="/termos" className="underline hover:text-gray-600">Termos de Uso</Link>{' '}
              e{' '}
              <Link href="/privacidade" className="underline hover:text-gray-600">Politica de Privacidade</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
