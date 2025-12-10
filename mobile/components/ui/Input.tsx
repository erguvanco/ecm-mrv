import { View, Text, TextInput, TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName,
  className,
  ...props
}: InputProps) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      )}
      <TextInput
        className={cn(
          'h-10 px-3 rounded-lg border bg-white text-slate-900',
          error ? 'border-red-500' : 'border-slate-200',
          'focus:border-slate-400',
          className
        )}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
