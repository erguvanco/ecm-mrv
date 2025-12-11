import { View, Text, FlatList, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Plus, Factory, Calendar, Scale, CheckCircle, Clock } from 'lucide-react-native';
import { api } from '@/services/api';

interface ProductionBatch {
  id: string;
  serialNumber: string | null;
  productionDate: string;
  status: string;
  inputFeedstockWeightTonnes: number;
  outputBiocharWeightTonnes: number;
  feedstockDelivery?: { feedstockType: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const isComplete = status === 'complete';
  return (
    <View
      className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${
        isComplete ? 'bg-green-100' : 'bg-amber-100'
      }`}
    >
      {isComplete ? (
        <CheckCircle color="#22c55e" size={12} />
      ) : (
        <Clock color="#f59e0b" size={12} />
      )}
      <Text
        className={`text-xs font-medium capitalize ${
          isComplete ? 'text-green-700' : 'text-amber-700'
        }`}
      >
        {status}
      </Text>
    </View>
  );
}

function ProductionCard({ item }: { item: ProductionBatch }) {
  const router = useRouter();
  const yieldPercent = item.inputFeedstockWeightTonnes > 0
    ? (item.outputBiocharWeightTonnes / item.inputFeedstockWeightTonnes) * 100
    : 0;

  return (
    <Pressable
      className="bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(`/production/${item.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 rounded-lg bg-blue-100 items-center justify-center">
              <Factory color="#3b82f6" size={16} />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">
                {item.serialNumber || 'No Serial'}
              </Text>
              <Text className="text-xs text-slate-500 capitalize">
                {item.feedstockDelivery?.feedstockType?.replace(/_/g, ' ') || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">
            {new Date(item.productionDate).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Scale color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">
            {item.inputFeedstockWeightTonnes.toFixed(1)}t → {item.outputBiocharWeightTonnes.toFixed(1)}t
          </Text>
        </View>
        <Text className="text-xs font-medium text-blue-600">
          {yieldPercent.toFixed(0)}% yield
        </Text>
      </View>
    </Pressable>
  );
}

export default function ProductionScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: batches = [], refetch, isLoading } = useQuery<ProductionBatch[]>({
    queryKey: ['production-batches'],
    queryFn: () => api.production.list(),
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
          <Text className="text-xl font-bold text-slate-900">Production</Text>
          <Text className="text-xs text-slate-500">{batches.length} batches</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1.5 bg-blue-500 px-3 py-2 rounded-lg active:bg-blue-600"
          onPress={() => router.push('/production/new')}
        >
          <Plus color="white" size={16} />
          <Text className="text-sm font-medium text-white">New Batch</Text>
        </Pressable>
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductionCard item={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-sm text-slate-500 mt-3">Loading batches...</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                <Factory color="#94a3b8" size={32} />
              </View>
              <Text className="text-base font-medium text-slate-700">No production batches</Text>
              <Text className="text-sm text-slate-500 mt-1">Create your first batch to get started</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
