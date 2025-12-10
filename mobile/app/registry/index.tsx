import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, FileCheck, CheckCircle, Clock, Send } from 'lucide-react-native';
import { api } from '@/services/api';
import { Badge, EmptyState } from '@/components/ui';

interface BCU {
  id: string;
  serialNumber: string;
  status: string;
  vintageYear: number;
  quantityTonnesCO2e: number;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'issued':
      return <CheckCircle color="#22c55e" size={14} />;
    case 'transferred':
      return <Send color="#3b82f6" size={14} />;
    default:
      return <Clock color="#f59e0b" size={14} />;
  }
}

export default function RegistryScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: bcus = [], refetch } = useQuery<BCU[]>({
    queryKey: ['bcus'],
    queryFn: () => api.registry.listBCUs(),
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
          title: 'BCU Registry',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <FlatList
          data={bcus}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              className="bg-white mx-4 mb-3 p-4 rounded-xl border border-slate-200 active:bg-slate-50"
              onPress={() => router.push(`/registry/${item.id}` as any)}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-lg bg-green-100 items-center justify-center">
                  <FileCheck color="#22c55e" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900 font-mono">
                    {item.serialNumber}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-slate-500">Vintage {item.vintageYear}</Text>
                    <Text className="text-xs text-slate-400">•</Text>
                    <Text className="text-xs text-emerald-600 font-medium">
                      {item.quantityTonnesCO2e.toFixed(2)} tCO₂e
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100">
                  <StatusIcon status={item.status} />
                  <Text className="text-xs text-slate-600 capitalize">{item.status}</Text>
                </View>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<FileCheck color="#94a3b8" size={32} />}
              title="No BCUs issued"
              description="Biochar Carbon Units will appear here"
            />
          }
        />
      </SafeAreaView>
    </>
  );
}
