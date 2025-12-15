import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Plus, Zap } from 'lucide-react-native';
import { api } from '@/services/api';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface EnergyUsage {
  id: string;
  periodStart: string;
  energyType: string;
  quantity: number;
  unit: string;
  scope: string;
}

export default function EnergyScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: records = [], refetch } = useQuery<EnergyUsage[]>({
    queryKey: ['energy-records'],
    queryFn: () => api.energy.list(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Energy Usage',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/energy/new')} className="ml-4">
              <Plus color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              className="bg-white mx-4 mb-3 p-4 rounded-xl border border-slate-200 active:bg-slate-50"
              onPress={() => router.push(`/energy/${item.id}` as never)}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-lg bg-amber-100 items-center justify-center">
                  <Zap color="#f59e0b" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900 capitalize">
                    {item.energyType.replace(/_/g, ' ')}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-slate-500">{formatDate(item.periodStart)}</Text>
                    <Text className="text-xs text-slate-400">•</Text>
                    <Text className="text-xs text-slate-500">{item.quantity} {item.unit}</Text>
                  </View>
                </View>
                <Badge variant={item.scope === 'production' ? 'success' : 'secondary'}>
                  {item.scope}
                </Badge>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Zap color="#94a3b8" size={32} />}
              title="No energy records"
              description="Track energy consumption"
              action={{ label: 'Add Record', onPress: () => router.push('/energy/new') }}
            />
          }
        />
      </SafeAreaView>
    </>
  );
}
