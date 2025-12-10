import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export function Card({ children, className, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(
          'bg-white rounded-xl border border-slate-200 active:bg-slate-50',
          className
        )}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cn('bg-white rounded-xl border border-slate-200', className)}>
      {children}
    </View>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={cn('p-4 border-b border-slate-100', className)}>
      {children}
    </View>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn('p-4', className)}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text className={cn('text-base font-semibold text-slate-900', className)}>
      {children}
    </Text>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <Text className={cn('text-sm text-slate-500', className)}>{children}</Text>
  );
}
