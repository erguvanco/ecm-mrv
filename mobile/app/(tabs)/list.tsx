import { View, Text, FlatList, RefreshControl, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  Leaf, Factory, ArrowDownToLine, Zap, Truck, Calendar, Scale,
  CheckCircle, Clock, MapPin, FileText
} from 'lucide-react-native';
import { api } from '@/services/api';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';

type Category = 'feedstock' | 'production' | 'sequestration' | 'energy' | 'transport';

const CATEGORIES: { key: Category; label: string; color: string; icon: React.ComponentType<{ color: string; size: number }> }[] = [
  { key: 'feedstock', label: 'Feedstock', color: '#22c55e', icon: Leaf },
  { key: 'production', label: 'Production', color: '#3b82f6', icon: Factory },
  { key: 'sequestration', label: 'Sequestration', color: '#8b5cf6', icon: ArrowDownToLine },
  { key: 'energy', label: 'Energy', color: '#f59e0b', icon: Zap },
  { key: 'transport', label: 'Transport', color: '#64748b', icon: Truck },
];

// Card components for each type
function FeedstockCard({ item }: { item: { id: string; serialNumber: string | null; date: string; feedstockType: string; weightTonnes: number; evidence?: { id: string }[] } }) {
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
              <Text className="text-sm font-semibold text-slate-900">{item.serialNumber || 'No Serial'}</Text>
              <Text className="text-xs text-slate-500 capitalize">{item.feedstockType.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        </View>
        <Text className="text-lg font-bold text-slate-900">{item.weightTonnes.toFixed(1)}t</Text>
      </View>
      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        {item.evidence && item.evidence.length > 0 && (
          <View className="flex-row items-center gap-1.5">
            <FileText color="#64748b" size={14} />
            <Text className="text-xs text-slate-500">{item.evidence.length} file{item.evidence.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function ProductionCard({ item }: { item: { id: string; serialNumber: string | null; productionDate: string; status: string; inputFeedstockWeightTonnes: number; outputBiocharWeightTonnes: number; feedstockDelivery?: { feedstockType: string } | null } }) {
  const router = useRouter();
  const yieldPercent = item.inputFeedstockWeightTonnes > 0 ? (item.outputBiocharWeightTonnes / item.inputFeedstockWeightTonnes) * 100 : 0;
  const isComplete = item.status === 'complete';

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
              <Text className="text-sm font-semibold text-slate-900">{item.serialNumber || 'No Serial'}</Text>
              <Text className="text-xs text-slate-500 capitalize">{item.feedstockDelivery?.feedstockType?.replace(/_/g, ' ') || 'Unknown'}</Text>
            </View>
          </View>
        </View>
        <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${isComplete ? 'bg-green-100' : 'bg-amber-100'}`}>
          {isComplete ? <CheckCircle color="#22c55e" size={12} /> : <Clock color="#f59e0b" size={12} />}
          <Text className={`text-xs font-medium capitalize ${isComplete ? 'text-green-700' : 'text-amber-700'}`}>{item.status}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">{new Date(item.productionDate).toLocaleDateString()}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Scale color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">{item.inputFeedstockWeightTonnes.toFixed(1)}t → {item.outputBiocharWeightTonnes.toFixed(1)}t</Text>
        </View>
        <Text className="text-xs font-medium text-blue-600">{yieldPercent.toFixed(0)}% yield</Text>
      </View>
    </Pressable>
  );
}

function SequestrationCard({ item }: { item: { id: string; serialNumber: string | null; finalDeliveryDate: string; totalBiocharWeightTonnes: number; estimatedCO2eTonnes: number | null; applicationMethod: string | null; siteDescription: string | null } }) {
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
              <Text className="text-sm font-semibold text-slate-900">{item.serialNumber || 'No Serial'}</Text>
              <Text className="text-xs text-slate-500 capitalize">{item.applicationMethod?.replace(/_/g, ' ') || 'Unknown method'}</Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-slate-900">{item.totalBiocharWeightTonnes.toFixed(1)}t</Text>
          {item.estimatedCO2eTonnes && <Text className="text-xs text-emerald-600 font-medium">{item.estimatedCO2eTonnes.toFixed(1)} tCO₂e</Text>}
        </View>
      </View>
      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-1.5">
          <Calendar color="#64748b" size={14} />
          <Text className="text-xs text-slate-500">{new Date(item.finalDeliveryDate).toLocaleDateString()}</Text>
        </View>
        {item.siteDescription && (
          <View className="flex-row items-center gap-1.5 flex-1">
            <MapPin color="#64748b" size={14} />
            <Text className="text-xs text-slate-500 flex-1" numberOfLines={1}>{item.siteDescription}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function EnergyCard({ item }: { item: { id: string; periodStart: string; energyType: string; quantity: number; unit: string; scope: string } }) {
  const router = useRouter();
  return (
    <Pressable
      className="bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(`/energy/${item.id}` as never)}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-lg bg-amber-100 items-center justify-center">
          <Zap color="#f59e0b" size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-slate-900 capitalize">{item.energyType.replace(/_/g, ' ')}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-slate-500">{formatDate(item.periodStart)}</Text>
            <Text className="text-xs text-slate-400">•</Text>
            <Text className="text-xs text-slate-500">{item.quantity} {item.unit}</Text>
          </View>
        </View>
        <Badge variant={item.scope === 'production' ? 'success' : 'secondary'}>{item.scope}</Badge>
      </View>
    </Pressable>
  );
}

function TransportCard({ item }: { item: { id: string; date: string; vehicleId: string | null; distanceKm: number; fuelType: string | null } }) {
  const router = useRouter();
  return (
    <Pressable
      className="bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(`/transport/${item.id}` as never)}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-lg bg-slate-100 items-center justify-center">
          <Truck color="#64748b" size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-slate-900">{item.vehicleId || 'Unknown Vehicle'}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-slate-500">{formatDate(item.date)}</Text>
            <Text className="text-xs text-slate-400">•</Text>
            <Text className="text-xs text-slate-500">{item.distanceKm.toFixed(1)} km</Text>
          </View>
        </View>
        {item.fuelType && <Badge variant="secondary">{item.fuelType}</Badge>}
      </View>
    </Pressable>
  );
}

export default function ListScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('feedstock');
  const [refreshing, setRefreshing] = useState(false);

  const { data: feedstocks = [], refetch: refetchFeedstock, isLoading: loadingFeedstock } = useQuery({
    queryKey: ['feedstocks'],
    queryFn: () => api.feedstock.list(),
    enabled: activeCategory === 'feedstock',
  });

  const { data: production = [], refetch: refetchProduction, isLoading: loadingProduction } = useQuery({
    queryKey: ['production-batches'],
    queryFn: () => api.production.list(),
    enabled: activeCategory === 'production',
  });

  const { data: sequestration = [], refetch: refetchSequestration, isLoading: loadingSequestration } = useQuery({
    queryKey: ['sequestration-events'],
    queryFn: () => api.sequestration.list(),
    enabled: activeCategory === 'sequestration',
  });

  const { data: energy = [], refetch: refetchEnergy, isLoading: loadingEnergy } = useQuery({
    queryKey: ['energy-records'],
    queryFn: () => api.energy.list(),
    enabled: activeCategory === 'energy',
  });

  const { data: transport = [], refetch: refetchTransport, isLoading: loadingTransport } = useQuery({
    queryKey: ['transport-events'],
    queryFn: () => api.transport.list(),
    enabled: activeCategory === 'transport',
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    switch (activeCategory) {
      case 'feedstock': await refetchFeedstock(); break;
      case 'production': await refetchProduction(); break;
      case 'sequestration': await refetchSequestration(); break;
      case 'energy': await refetchEnergy(); break;
      case 'transport': await refetchTransport(); break;
    }
    setRefreshing(false);
  }, [activeCategory, refetchFeedstock, refetchProduction, refetchSequestration, refetchEnergy, refetchTransport]);

  const getListData = () => {
    switch (activeCategory) {
      case 'feedstock': return { data: feedstocks, loading: loadingFeedstock };
      case 'production': return { data: production, loading: loadingProduction };
      case 'sequestration': return { data: sequestration, loading: loadingSequestration };
      case 'energy': return { data: energy, loading: loadingEnergy };
      case 'transport': return { data: transport, loading: loadingTransport };
    }
  };

  const { data, loading } = getListData();
  const activeCat = CATEGORIES.find(c => c.key === activeCategory)!;

  const renderItem = ({ item }: { item: unknown }) => {
    switch (activeCategory) {
      case 'feedstock': return <FeedstockCard item={item as never} />;
      case 'production': return <ProductionCard item={item as never} />;
      case 'sequestration': return <SequestrationCard item={item as never} />;
      case 'energy': return <EnergyCard item={item as never} />;
      case 'transport': return <TransportCard item={item as never} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Category Tabs */}
      <View className="bg-white border-b border-slate-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.key === activeCategory;
            const Icon = cat.icon;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isActive ? 'bg-slate-900' : 'bg-slate-100'}`}
              >
                <Icon color={isActive ? 'white' : cat.color} size={16} />
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={data as { id: string }[]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={activeCat.color} />
              <Text className="text-sm text-slate-500 mt-3">Loading...</Text>
            </View>
          ) : (
            <EmptyState
              icon={<activeCat.icon color="#94a3b8" size={32} />}
              title={`No ${activeCat.label.toLowerCase()}`}
              description="Records will appear here"
            />
          )
        }
      />
    </SafeAreaView>
  );
}
