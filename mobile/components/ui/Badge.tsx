import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

const variantStyles = {
  default: 'bg-slate-900',
  secondary: 'bg-slate-100',
  success: 'bg-green-100',
  warning: 'bg-amber-100',
  destructive: 'bg-red-100',
  outline: 'bg-transparent border border-slate-200',
};

const textStyles = {
  default: 'text-white',
  secondary: 'text-slate-700',
  success: 'text-green-700',
  warning: 'text-amber-700',
  destructive: 'text-red-700',
  outline: 'text-slate-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <View
      className={cn(
        'px-2 py-0.5 rounded-full self-start',
        variantStyles[variant],
        className
      )}
    >
      <Text className={cn('text-xs font-medium', textStyles[variant])}>
        {children}
      </Text>
    </View>
  );
}
