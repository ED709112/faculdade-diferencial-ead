'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  FiGrid,
  FiBookOpen,
  FiUsers,
  FiUser,
  FiTag,
  FiPercent,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiFileText,
  FiImage,
  FiBell,
  FiShield,
  FiAward,
  FiDownload,
  FiHeart,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiCalendar,
  FiShoppingBag,
} from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student';
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/admin', icon: FiGrid },
  { label: 'Cursos', href: '/admin/cursos', icon: FiBookOpen },
  { label: 'Categorias', href: '/admin/categorias', icon: FiTag },
  { label: 'Professores', href: '/admin/professores', icon: FiUsers },
  { label: 'Alunos', href: '/admin/alunos', icon: FiUser },
  { label: 'Matrículas', href: '/admin/matriculas', icon: FiPercent },
  { label: 'Duração dos Cursos', href: '/admin/duracao-cursos', icon: FiCalendar },
  { label: 'Cupons', href: '/admin/cupons', icon: FiDollarSign },
  { label: 'Produtos', href: '/admin/produtos', icon: FiShoppingBag },
  { label: 'Financeiro', href: '/admin/financeiro', icon: FiBarChart2 },
  { label: 'Badges', href: '/admin/badges', icon: FiStar },
  { label: 'Configurações', href: '/admin/configuracoes', icon: FiSettings },
  { label: 'Usuários', href: '/admin/usuarios', icon: FiShield },
  { label: 'Banners', href: '/admin/banners', icon: FiImage },
  { label: 'Notícias', href: '/admin/noticias', icon: FiFileText },
  { label: 'Logs', href: '/admin/logs', icon: FiBell },
  { label: 'Gerenciar Admins', href: '/admin/gerenciar-admins', icon: FiShield },
];

const adminPermissionMap: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/cursos': 'courses',
  '/admin/categorias': 'categories',
  '/admin/professores': 'teachers',
  '/admin/alunos': 'students',
  '/admin/matriculas': 'enrollments',
  '/admin/duracao-cursos': 'durations',
  '/admin/cupons': 'coupons',
  '/admin/produtos': 'products',
  '/admin/financeiro': 'financial',
  '/admin/badges': 'badges',
  '/admin/configuracoes': 'settings',
  '/admin/usuarios': 'users',
  '/admin/banners': 'banners',
  '/admin/noticias': 'news',
  '/admin/logs': 'logs',
  '/admin/gerenciar-admins': 'admin_managers',
};

const teacherMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: FiGrid },
  { label: 'Meus Cursos', href: '/professor/cursos', icon: FiBookOpen },
  { label: 'Alunos', href: '/professor/alunos', icon: FiUsers },
  { label: 'Certificados', href: '/professor/certificados', icon: FiAward },
];

const studentMenu: MenuItem[] = [
  { label: 'Meus Cursos', href: '/aluno/cursos', icon: FiBookOpen },
  { label: 'Loja', href: '/aluno/loja', icon: FiShoppingBag },
  { label: 'Calendário', href: '/aluno/calendario', icon: FiCalendar },
  { label: 'Certificados', href: '/aluno/certificados', icon: FiAward },
  { label: 'Conquistas', href: '/aluno/conquistas', icon: FiStar },
  { label: 'Downloads', href: '/aluno/download', icon: FiDownload },
  { label: 'Favoritos', href: '/aluno/favoritos', icon: FiHeart },
  { label: 'Perfil', href: '/aluno/perfil', icon: FiUser },
  { label: 'Mensagens', href: '/aluno/mensagens', icon: FiMessageSquare },
];

const menuByRole: Record<string, MenuItem[]> = {
  admin: adminMenu,
  teacher: teacherMenu,
  student: studentMenu,
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  teacher: 'Professor',
  student: 'Aluno',
};

export default function Sidebar({ role }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const baseMenu = menuByRole[role] || [];

  const menu = role === 'admin'
    ? baseMenu.filter(item => {
        const permKey = adminPermissionMap[item.href];
        if (!permKey) return true;
        return hasPermission(permKey);
      })
    : baseMenu;

  return (
    <aside
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* User Info */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <FaGraduationCap className="text-primary-500" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role === 'admin' && user?.admin_level === 'master' ? 'Admin Master' : role === 'admin' && user?.admin_level === 'limited' ? 'Admin Limitado' : roleLabels[role]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''} ${
                collapsed ? 'justify-center !px-0' : ''
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="text-lg shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full justify-center"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>
    </aside>
  );
}
