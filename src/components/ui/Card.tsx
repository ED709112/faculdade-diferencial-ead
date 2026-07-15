import React from 'react';
import { View, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantMap = {
  default: 'bg-white dark:bg-gray-800 rounded-2xl',
  elevated: 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg',
  outlined: 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: CardProps & { className?: string }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`${variantMap[variant]} ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

export function CardView({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <View
      className={`${variantMap[variant]} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </View>
  );
}
