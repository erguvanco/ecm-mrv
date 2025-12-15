import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center py-12 px-6', className)}>
      {icon && (
        <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
          {icon}
        </View>
      )}
      <Text className="text-base font-medium text-slate-700 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-slate-500 text-center mt-1">
          {description}
        </Text>
      )}
      {action && (
        <Pressable
          onPress={action.onPress}
          className="mt-4 bg-slate-900 px-4 py-2 rounded-lg active:bg-slate-800"
        >
          <Text className="text-sm font-medium text-white">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
