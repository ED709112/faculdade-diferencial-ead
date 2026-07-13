'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FiMenu, FiX, FiUser, FiLogOut, FiChevronDown, FiBookOpen, FiGrid, FiInfo, FiPhone } from 'react-icons/fi';

const navLinks = [
  { label: 'Cursos', href: '/cursos', icon: FiBookOpen },
  { label: 'Matrícula', href: '/matricula', icon: FiGrid },
  { label: 'Categorias', href: '/categorias', icon: FiGrid },
  { label: 'Sobre', href: '/sobre', icon: FiInfo },
  { label: 'Contato', href: '/contato', icon: FiPhone },
];

const roleRoutes: Record<string, { label: string; href: string }> = {
  admin: { label: 'Painel Admin', href: '/admin/dashboard' },
  teacher: { label: 'Painel Professor', href: '/professor/dashboard' },
  student: { label: 'Meus Cursos', href: '/aluno/cursos' },
};

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const roleInfo = user ? roleRoutes[user.role] : null;

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-500'
                    : 'text-gray-600 hover:bg-secondary-50 hover:text-secondary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login" className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 bg-secondary-50 hover:bg-secondary-100 transition-colors border border-secondary-200">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="text-primary-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <FiChevronDown
                    className={`text-gray-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    {roleInfo && (
                      <Link
                        href={roleInfo.href}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FiBookOpen className="text-gray-400" />
                        {roleInfo.label}
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-500'
                    : 'text-gray-600 hover:bg-secondary-50 hover:text-secondary-600'
                }`}
              >
                <link.icon className="text-lg" />
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
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
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  {roleInfo && (
                    <Link
                      href={roleInfo.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <FiBookOpen />
                      {roleInfo.label}
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiLogOut />
                    Sair
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500" />
    </header>
  );
}
