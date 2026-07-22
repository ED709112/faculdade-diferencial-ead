'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiBookOpen, FiGrid, FiInfo, FiPhone, FiShoppingBag, FiShoppingCart, FiSun, FiMoon, FiHome } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import { useTheme } from '@/contexts/ThemeContext';

const instituicaoLinks = [
  { label: 'Sobre', href: '/sobre' },
  { label: 'Histórico', href: '/sobre#historico' },
  { label: 'Biblioteca', href: '/sobre#biblioteca' },
  { label: 'Calendário Acadêmico', href: '/sobre#calendario' },
  { label: 'Editais e Portarias', href: '/sobre#editais' },
  { label: 'Missão & Visão', href: '/sobre#missao' },
  { label: 'Monitoria', href: '/sobre#monitoria' },
  { label: 'Portal do Egresso', href: '/sobre#egresso' },
];

const navLinks = [
  { label: 'Início', href: '/', icon: FiHome },
  { label: 'Instituição', href: '/sobre', icon: FiGrid, hasDropdown: true },
  { label: 'Produtos', href: '/produtos', icon: FiShoppingBag },
  { label: 'Matrícula', href: '/matricula', icon: FiGrid },
  { label: 'Categorias', href: '/categorias', icon: FiGrid },
  { label: 'Contato', href: '/contato', icon: FiPhone },
];

const roleRoutes: Record<string, { label: string; href: string }> = {
  admin: { label: 'Painel Admin', href: '/admin/dashboard' },
  teacher: { label: 'Painel Professor', href: '/professor/dashboard' },
  student: { label: 'Meus Cursos', href: '/aluno/cursos' },
};

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [instituicaoOpen, setInstituicaoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const instituicaoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (instituicaoRef.current && !instituicaoRef.current.contains(e.target as Node)) {
        setInstituicaoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setInstituicaoOpen(false);
  }, [pathname]);

  const roleInfo = user ? roleRoutes[user.role] : null;

  return (
    <header
      className={`sticky top-0 z-50 bg-white dark:bg-gray-800 transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/images/logo.jpg"
              alt="Faculdade Diferencial EAD"
              className="h-10 lg:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.href} className="relative" ref={instituicaoRef}>
                    <button
                      onClick={() => setInstituicaoOpen(!instituicaoOpen)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        pathname.startsWith('/sobre')
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600'
                      }`}
                    >
                      <FiGrid className="text-base" />
                      Instituição
                      <FiChevronDown className={`text-gray-400 transition-transform duration-200 ${instituicaoOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {instituicaoOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in z-50">
                        {instituicaoLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setInstituicaoOpen(false)}
                            className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    link.href === '/'
                      ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                      : pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? (
                <FiMoon className="text-xl text-gray-600 dark:text-gray-300" />
              ) : (
                <FiSun className="text-xl text-yellow-400" />
              )}
            </button>
            <Link href="/carrinho" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <FiShoppingCart className="text-xl text-gray-600 dark:text-gray-300" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors border border-secondary-200 dark:border-secondary-800">
                  Entrar
                </Link>
                <Link href="/matricula" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-secondary-500 hover:bg-secondary-600 transition-colors shadow-lg shadow-secondary-500/25">
                  Matricule-se
                </Link>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="text-primary-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <FiChevronDown
                    className={`text-gray-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {roleInfo && (
                      <Link
                        href={roleInfo.href}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiBookOpen className="text-gray-400" />
                        {roleInfo.label}
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FiLogOut />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {mobileOpen ? <FiX className="text-xl text-gray-900 dark:text-gray-100" /> : <FiMenu className="text-xl text-gray-900 dark:text-gray-100" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-700 py-4 space-y-1">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.href}>
                    <button
                      onClick={() => setInstituicaoOpen(!instituicaoOpen)}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        pathname.startsWith('/sobre')
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600'
                      }`}
                    >
                      <FiGrid className="text-lg" />
                      Instituição
                      <FiChevronDown className={`ml-auto text-gray-400 transition-transform duration-200 ${instituicaoOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {instituicaoOpen && (
                      <div className="pl-10 space-y-1 mt-1">
                        {instituicaoLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    link.href === '/'
                      ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                      : pathname === link.href || pathname.startsWith(link.href + '/')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600'
                  }`}
                >
                  <link.icon className="text-lg" />
                  {link.label}
                </Link>
              );
            })}

            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 space-y-1">
              <Link
                href="/carrinho"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 hover:text-secondary-600 transition-colors"
              >
                <FiShoppingCart className="text-lg" />
                Carrinho
                {itemCount > 0 && (
                  <span className="bg-secondary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {itemCount}
                  </span>
                )}
              </Link>
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/matricula"
                    className="block mx-4 py-3 text-sm font-semibold text-white bg-primary-500 rounded-lg text-center hover:bg-primary-600"
                  >
                    Matricule-se
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  {roleInfo && (
                    <Link
                      href={roleInfo.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <FiBookOpen />
                      {roleInfo.label}
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <FiLogOut />
                    Sair
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 px-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500" />
    </header>
  );
}
