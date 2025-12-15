import { View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Factory, Leaf, ArrowDownToLine, TrendingUp, Calendar, Award, Clock } from 'lucide-react-native';
import { api } from '@/services/api';

interface DashboardStats {
  feedstockCount: number;
  productionCount: number;
  sequestrationCount: number;
  totalBiocharTonnes: number;
  totalCO2eTonnes: number;
  totalCORCsIssued: number;
  corcsDraft: number;
  corcsIssued: number;
  corcsRetired: number;
  pendingVerification: number;
  activeMonitoringPeriod: {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  } | null;
}

interface RecentItem {
  id: string;
  type: 'feedstock' | 'production' | 'sequestration';
  title: string;
  subtitle: string;
  date: string;
}

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  onPress,
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="flex-1 bg-white rounded-xl p-4 border border-slate-200 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon color={color} size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && <Text className="text-sm font-normal text-slate-500"> {unit}</Text>}
          </Text>
          <Text className="text-xs text-slate-500 mt-0.5">{title}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RecentActivityCard({ item, onPress }: { item: RecentItem; onPress: () => void }) {
  const iconMap = {
    feedstock: { icon: Leaf, color: '#22c55e', bg: 'bg-green-100' },
    production: { icon: Factory, color: '#3b82f6', bg: 'bg-blue-100' },
    sequestration: { icon: ArrowDownToLine, color: '#8b5cf6', bg: 'bg-purple-100' },
  };

  const { icon: Icon, color, bg } = iconMap[item.type];

  return (
    <Pressable
      className="flex-row items-center gap-3 bg-white rounded-xl p-3 border border-slate-200 mb-2 active:bg-slate-50"
      onPress={onPress}
    >
      <View className={`h-10 w-10 rounded-lg items-center justify-center ${bg}`}>
        <Icon color={color} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-slate-900">{item.title}</Text>
        <Text className="text-xs text-slate-500">{item.subtitle}</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Calendar color="#94a3b8" size={12} />
        <Text className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
  });

  // Fetch recent items from each category
  const { data: feedstocks = [] } = useQuery({
    queryKey: ['feedstocks'],
    queryFn: () => api.feedstock.list(),
  });

  const { data: production = [] } = useQuery({
    queryKey: ['production-batches'],
    queryFn: () => api.production.list(),
  });

  const { data: sequestration = [] } = useQuery({
    queryKey: ['sequestration-events'],
    queryFn: () => api.sequestration.list(),
  });

  // Combine and sort recent items
  const recentItems: RecentItem[] = [
    ...feedstocks.slice(0, 5).map((f: { id: string; serialNumber: string | null; feedstockType: string; weightTonnes: number; date: string }) => ({
      id: f.id,
      type: 'feedstock' as const,
      title: f.serialNumber || 'Feedstock Delivery',
      subtitle: `${f.feedstockType?.replace(/_/g, ' ')} - ${f.weightTonnes?.toFixed(1)}t`,
      date: f.date,
    })),
    ...production.slice(0, 5).map((p: { id: string; serialNumber: string | null; outputBiocharWeightTonnes: number; productionDate: string }) => ({
      id: p.id,
      type: 'production' as const,
      title: p.serialNumber || 'Production Batch',
      subtitle: `${p.outputBiocharWeightTonnes?.toFixed(1)}t biochar`,
      date: p.productionDate,
    })),
    ...sequestration.slice(0, 5).map((s: { id: string; serialNumber: string | null; applicationMethod: string | null; totalBiocharWeightTonnes: number; finalDeliveryDate: string }) => ({
      id: s.id,
      type: 'sequestration' as const,
      title: s.serialNumber || 'Sequestration Event',
      subtitle: `${s.applicationMethod?.replace(/_/g, ' ')} - ${s.totalBiocharWeightTonnes?.toFixed(1)}t`,
      date: s.finalDeliveryDate,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStats();
    setRefreshing(false);
  }, [refetchStats]);

  const handleRecentItemPress = (item: RecentItem) => {
    router.push(`/${item.type}/${item.id}` as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="mb-2">
          <Text className="text-2xl font-bold text-slate-900">ECM MRV</Text>
          <Text className="text-sm text-slate-500">Biochar Carbon Credit Tracking</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          <StatCard
            title="Feedstock"
            value={stats?.feedstockCount ?? 0}
            icon={Leaf}
            color="#22c55e"
            onPress={() => router.push('/list' as never)}
          />
          <StatCard
            title="Production"
            value={stats?.productionCount ?? 0}
            icon={Factory}
            color="#3b82f6"
            onPress={() => router.push('/list' as never)}
          />
        </View>

        <View className="flex-row gap-3">
          <StatCard
            title="Sequestration"
            value={stats?.sequestrationCount ?? 0}
            icon={ArrowDownToLine}
            color="#8b5cf6"
            onPress={() => router.push('/list' as never)}
          />
          <StatCard
            title="Biochar"
            value={stats?.totalBiocharTonnes?.toFixed(1) ?? '0'}
            unit="t"
            icon={TrendingUp}
            color="#f59e0b"
          />
        </View>

        {/* CORC Highlight */}
        <View className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-emerald-700">CORCs Issued</Text>
              <Text className="text-3xl font-bold text-emerald-600 mt-1">
                {stats?.totalCORCsIssued?.toFixed(1) ?? '0'} <Text className="text-lg">tCO2e</Text>
              </Text>
              <View className="flex-row gap-3 mt-2">
                <Text className="text-xs text-emerald-600">
                  {stats?.corcsIssued ?? 0} issued
                </Text>
                <Text className="text-xs text-emerald-600">
                  {stats?.corcsRetired ?? 0} retired
                </Text>
              </View>
            </View>
            <View className="h-14 w-14 rounded-full bg-emerald-100 items-center justify-center">
              <Award color="#16a34a" size={28} />
            </View>
          </View>
        </View>

        {/* Active Monitoring Period */}
        {stats?.activeMonitoringPeriod && (
          <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-center gap-2">
              <Clock color="#3b82f6" size={16} />
              <Text className="text-sm font-medium text-blue-700">Active Monitoring Period</Text>
            </View>
            <Text className="text-xs text-blue-600 mt-1">
              {new Date(stats.activeMonitoringPeriod.periodStart).toLocaleDateString()} - {new Date(stats.activeMonitoringPeriod.periodEnd).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Recent Activity */}
        <View className="mt-2">
          <Text className="text-sm font-semibold text-slate-700 mb-3">Recent Activity</Text>
          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <RecentActivityCard
                key={`${item.type}-${item.id}`}
                item={item}
                onPress={() => handleRecentItemPress(item)}
              />
            ))
          ) : (
            <View className="bg-white rounded-xl p-6 border border-slate-200 items-center">
              <ActivityIndicator size="small" color="#94a3b8" />
              <Text className="text-sm text-slate-500 mt-2">Loading recent activity...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
