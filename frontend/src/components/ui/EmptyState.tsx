import React from 'react';
import Link from 'next/link';
import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon || <FiInbox className="text-3xl text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action && (
        <Link href={action.href} className="btn-primary text-sm">
          {action.label}
        </Link>
      )}
    </div>
  );
}
