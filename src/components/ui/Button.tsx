import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-primary-600 active:bg-primary-700',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  outline: 'border border-primary-600 bg-transparent',
  ghost: 'bg-transparent',
};

const textVariants = {
  primary: 'text-white font-semibold',
  secondary: 'text-white font-semibold',
  outline: 'text-primary-600 font-semibold',
  ghost: 'text-primary-600 font-semibold',
};

const sizes = {
  sm: 'py-2 px-4 rounded-lg',
  md: 'py-3 px-6 rounded-xl',
  lg: 'py-4 px-8 rounded-xl',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''} flex-row items-center justify-center gap-2`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? '#ffffff' : '#1a56db'} size="small" />
      ) : (
        <>
          {icon}
          <Text className={`${textVariants[variant]} ${textSizes[size]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
