import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  default: 'bg-slate-900 active:bg-slate-800',
  secondary: 'bg-slate-100 active:bg-slate-200',
  outline: 'bg-transparent border border-slate-200 active:bg-slate-100',
  destructive: 'bg-red-500 active:bg-red-600',
  ghost: 'bg-transparent active:bg-slate-100',
};

const variantTextStyles = {
  default: 'text-white',
  secondary: 'text-slate-900',
  outline: 'text-slate-900',
  destructive: 'text-white',
  ghost: 'text-slate-900',
};

const sizeStyles = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3',
  lg: 'h-12 px-6',
  icon: 'h-10 w-10',
};

const sizeTextStyles = {
  default: 'text-sm',
  sm: 'text-xs',
  lg: 'text-base',
  icon: 'text-sm',
};

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  className,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? 'white' : '#1e293b'}
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          {typeof children === 'string' ? (
            <Text
              className={cn(
                'font-medium',
                variantTextStyles[variant],
                sizeTextStyles[size]
              )}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}
