import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Plus, Leaf, Calendar, Scale, FileText } from 'lucide-react-native';
import { api } from '@/services/api';

interface FeedstockDelivery {
  id: string;
  serialNumber: string | null;
  date: string;
  feedstockType: string;
  weightTonnes: number;
  evidence?: { id: string }[];
}

function FeedstockCard({ item }: { item: FeedstockDelivery }) {
  const router = useRouter();

  return (
    <Pressable
      className="bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(`/feedstock/${item.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 rounded-lg bg-green-100 items-center justify-center">
              <Leaf color="#22c55e" size={16} />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">
                {item.serialNumber || 'No Serial'}
              </Text>
              <Text className="text-xs text-slate-500 capitalize">
                {item.feedstockType.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-lg font-bold text-slate-900">
          {item.weightTonnes.toFixed(1)}t
        </Text>
      </View>

      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        {item.evidence && item.evidence.length > 0 && (
          <View className="flex-row items-center gap-1.5">
            <FileText color="#64748b" size={14} />
            <Text className="text-xs text-slate-500">
              {item.evidence.length} file{item.evidence.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function FeedstockScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: feedstocks = [], refetch, isLoading } = useQuery<FeedstockDelivery[]>({
    queryKey: ['feedstocks'],
    queryFn: () => api.feedstock.list(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <View>
          <Text className="text-xl font-bold text-slate-900">Feedstock</Text>
          <Text className="text-xs text-slate-500">{feedstocks.length} deliveries</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1.5 bg-green-500 px-3 py-2 rounded-lg active:bg-green-600"
          onPress={() => router.push('/feedstock/new')}
        >
          <Plus color="white" size={16} />
          <Text className="text-sm font-medium text-white">Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={feedstocks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedstockCard item={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Leaf color="#94a3b8" size={32} />
            </View>
            <Text className="text-base font-medium text-slate-700">No feedstock deliveries</Text>
            <Text className="text-sm text-slate-500 mt-1">Add your first delivery to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
