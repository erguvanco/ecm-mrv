import { View, Text, FlatList, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Plus, ArrowDownToLine, Calendar, MapPin } from 'lucide-react-native';
import { api } from '@/services/api';

interface SequestrationEvent {
  id: string;
  serialNumber: string | null;
  finalDeliveryDate: string;
  totalBiocharWeightTonnes: number;
  estimatedCO2eTonnes: number | null;
  applicationMethod: string | null;
  siteDescription: string | null;
}

function SequestrationCard({ item }: { item: SequestrationEvent }) {
  const router = useRouter();

  return (
    <Pressable
      className="bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(`/sequestration/${item.id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 rounded-lg bg-purple-100 items-center justify-center">
              <ArrowDownToLine color="#8b5cf6" size={16} />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">
                {item.serialNumber || 'No Serial'}
              </Text>
              <Text className="text-xs text-slate-500 capitalize">
                {item.applicationMethod?.replace(/_/g, ' ') || 'Unknown method'}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-slate-900">
            {item.totalBiocharWeightTonnes.toFixed(1)}t
          </Text>
          {item.estimatedCO2eTonnes && (
            <Text className="text-xs text-emerald-600 font-medium">
              {item.estimatedCO2eTonnes.toFixed(1)} tCO₂e
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">
            {new Date(item.finalDeliveryDate).toLocaleDateString()}
          </Text>
        </View>
        {item.siteDescription && (
          <View className="flex-row items-center gap-1.5 flex-1">
            <MapPin color="#64748b" size={14} />
            <Text className="text-xs text-slate-500 flex-1" numberOfLines={1}>
              {item.siteDescription}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SequestrationScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: events = [], refetch, isLoading } = useQuery<SequestrationEvent[]>({
    queryKey: ['sequestration-events'],
    queryFn: () => api.sequestration.list(),
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
          <Text className="text-xl font-bold text-slate-900">Sequestration</Text>
          <Text className="text-xs text-slate-500">{events.length} events</Text>
        </View>
        <Pressable
          className="flex-row items-center gap-1.5 bg-purple-500 px-3 py-2 rounded-lg active:bg-purple-600"
          onPress={() => router.push('/sequestration/new')}
        >
          <Plus color="white" size={16} />
          <Text className="text-sm font-medium text-white">Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SequestrationCard item={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text className="text-sm text-slate-500 mt-3">Loading events...</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                <ArrowDownToLine color="#94a3b8" size={32} />
              </View>
              <Text className="text-base font-medium text-slate-700">No sequestration events</Text>
              <Text className="text-sm text-slate-500 mt-1">Record biochar applications to track carbon</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
