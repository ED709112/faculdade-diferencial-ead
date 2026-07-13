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
  { label: 'Financeiro', href: '/admin/financeiro', icon: FiBarChart2 },
  { label: 'Badges', href: '/admin/badges', icon: FiStar },
  { label: 'Configurações', href: '/admin/configuracoes', icon: FiSettings },
  { label: 'Usuários', href: '/admin/usuarios', icon: FiShield },
  { label: 'Banners', href: '/admin/banners', icon: FiImage },
  { label: 'Notícias', href: '/admin/noticias', icon: FiFileText },
  { label: 'Logs', href: '/admin/logs', icon: FiBell },
];

const teacherMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/professor/dashboard', icon: FiGrid },
  { label: 'Meus Cursos', href: '/professor/cursos', icon: FiBookOpen },
  { label: 'Alunos', href: '/professor/alunos', icon: FiUsers },
  { label: 'Certificados', href: '/professor/certificados', icon: FiAward },
];

const studentMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/aluno/cursos', icon: FiGrid },
  { label: 'Meus Cursos', href: '/aluno/cursos', icon: FiBookOpen },
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
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menu = menuByRole[role] || [];

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <FaGraduationCap className="text-primary-500" />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[role]}</p>
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
      <div className="p-3 border-t border-gray-100">
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
