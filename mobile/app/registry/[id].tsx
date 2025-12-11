import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileCheck, CheckCircle, Clock, Send, Calendar, Hash } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui';

interface BCUDetail {
  id: string;
  serialNumber: string;
  status: string;
  vintageYear: number;
  quantityTonnesCO2e: number;
  issuedAt: string | null;
  retiredAt: string | null;
  transferredAt: string | null;
  sequestrationEventId: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    issued: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, iconColor: '#22c55e' },
    transferred: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Send, iconColor: '#3b82f6' },
    retired: { bg: 'bg-slate-100', text: 'text-slate-700', icon: CheckCircle, iconColor: '#64748b' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, iconColor: '#f59e0b' },
  };
  
  const { bg, text, icon: Icon, iconColor } = config[status as keyof typeof config] || config.pending;
  
  return (
    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${bg}`}>
      <Icon color={iconColor} size={14} />
      <Text className={`text-sm font-medium capitalize ${text}`}>{status}</Text>
    </View>
  );
}

export default function BCUDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: bcu, isLoading, error } = useQuery<BCUDetail>({
    queryKey: ['bcu', id],
    queryFn: () => api.registry.getBCU(id!) as Promise<BCUDetail>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  if (error || !bcu) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load BCU details</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'BCU Details',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Header Card */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 rounded-xl bg-green-100 items-center justify-center">
                    <FileCheck color="#22c55e" size={24} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-mono text-slate-500">Serial Number</Text>
                    <Text className="text-lg font-bold text-slate-900 font-mono">
                      {bcu.serialNumber}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={bcu.status} />
              </View>

              {/* Carbon Credits */}
              <View className="bg-emerald-50 rounded-lg p-4">
                <Text className="text-xs text-emerald-600 mb-1">Carbon Credits</Text>
                <Text className="text-3xl font-bold text-emerald-700">
                  {bcu.quantityTonnesCO2e.toFixed(2)}
                </Text>
                <Text className="text-sm text-emerald-600">tonnes CO₂e</Text>
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">BCU Information</Text>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Hash color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Serial Number</Text>
                  <Text className="text-sm font-medium text-slate-900 font-mono">
                    {bcu.serialNumber}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Calendar color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Vintage Year</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {bcu.vintageYear}
                  </Text>
                </View>
              </View>

              <View className="py-3 border-b border-slate-100">
                <Text className="text-xs text-slate-500 mb-1">Status</Text>
                <Text className="text-sm font-medium text-slate-900 capitalize">
                  {bcu.status}
                </Text>
              </View>

              <View className="py-3">
                <Text className="text-xs text-slate-500 mb-1">Quantity</Text>
                <Text className="text-sm font-medium text-slate-900">
                  {bcu.quantityTonnesCO2e.toFixed(4)} tCO₂e
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Actions hint */}
          <View className="mt-4 p-4 bg-blue-50 rounded-xl">
            <Text className="text-sm text-blue-700">
              To transfer or retire this BCU, please use the full web experience.
            </Text>
            <Pressable
              onPress={() => router.push({ pathname: '/web', params: { path: `/registry/bcu/${id}` } })}
              className="mt-2"
            >
              <Text className="text-sm font-medium text-blue-600">Open in Web App →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
