import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Plus, Truck } from 'lucide-react-native';
import { api } from '@/services/api';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface TransportEvent {
  id: string;
  date: string;
  vehicleId: string | null;
  distanceKm: number;
  fuelType: string | null;
  fuelAmount: number | null;
}

export default function TransportScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: events = [], refetch } = useQuery<TransportEvent[]>({
    queryKey: ['transport-events'],
    queryFn: () => api.transport.list(),
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
          title: 'Logistics (On-Site)',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push('/transport/new')} className="ml-4">
              <Plus color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              className="bg-white mx-4 mb-3 p-4 rounded-xl border border-slate-200 active:bg-slate-50"
              onPress={() =>
                router.push({ pathname: '/transport/[id]', params: { id: item.id } })
              }
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-lg bg-slate-100 items-center justify-center">
                  <Truck color="#64748b" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900">
                    {item.vehicleId || 'Unknown Vehicle'}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-slate-500">{formatDate(item.date)}</Text>
                    <Text className="text-xs text-slate-400">•</Text>
                    <Text className="text-xs text-slate-500">{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                </View>
                {item.fuelType && (
                  <Badge variant="secondary">{item.fuelType}</Badge>
                )}
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Truck color="#94a3b8" size={32} />}
              title="No transport events"
              description="Record internal logistics activities"
              action={{ label: 'Add Event', onPress: () => router.push('/transport/new') }}
            />
          }
        />
      </SafeAreaView>
    </>
  );
}
