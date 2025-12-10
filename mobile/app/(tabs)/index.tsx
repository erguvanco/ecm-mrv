import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Factory, Leaf, ArrowDownToLine, TrendingUp, QrCode } from 'lucide-react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { api } from '@/services/api';

interface DashboardStats {
  feedstockCount: number;
  productionCount: number;
  sequestrationCount: number;
  totalBiocharTonnes: number;
  totalCO2eTonnes: number;
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

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Chart data
  const barData = [
    { value: stats?.feedstockCount ?? 0, label: 'Feed', frontColor: '#22c55e' },
    { value: stats?.productionCount ?? 0, label: 'Prod', frontColor: '#3b82f6' },
    { value: stats?.sequestrationCount ?? 0, label: 'Seq', frontColor: '#8b5cf6' },
  ];

  const pieData = [
    {
      value: stats?.totalBiocharTonnes ?? 0,
      color: '#f59e0b',
      text: 'Biochar',
      focused: true,
    },
    {
      value: stats?.totalCO2eTonnes ?? 0,
      color: '#10b981',
      text: 'CO2e',
    },
  ];

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
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-2xl font-bold text-slate-900">ECM MRV</Text>
            <Text className="text-sm text-slate-500">Biochar Carbon Credit Tracking</Text>
          </View>
          <Pressable
            onPress={() => router.push('/scan')}
            className="h-10 w-10 rounded-full bg-slate-900 items-center justify-center active:opacity-80"
          >
            <QrCode color="white" size={20} />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          <StatCard
            title="Feedstock Deliveries"
            value={stats?.feedstockCount ?? 0}
            icon={Leaf}
            color="#22c55e"
            onPress={() => router.push('/(tabs)/feedstock')}
          />
          <StatCard
            title="Production Batches"
            value={stats?.productionCount ?? 0}
            icon={Factory}
            color="#3b82f6"
            onPress={() => router.push('/(tabs)/production')}
          />
        </View>

        <View className="flex-row gap-3">
          <StatCard
            title="Sequestration Events"
            value={stats?.sequestrationCount ?? 0}
            icon={ArrowDownToLine}
            color="#8b5cf6"
            onPress={() => router.push('/(tabs)/sequestration')}
          />
          <StatCard
            title="Biochar Produced"
            value={stats?.totalBiocharTonnes?.toFixed(1) ?? '0'}
            unit="t"
            icon={TrendingUp}
            color="#f59e0b"
          />
        </View>

        {/* CO2 Highlight */}
        <View className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-emerald-700">Total Carbon Sequestered</Text>
              <Text className="text-3xl font-bold text-emerald-600 mt-1">
                {stats?.totalCO2eTonnes?.toFixed(1) ?? '0'} <Text className="text-lg">tCO2e</Text>
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-emerald-100 items-center justify-center">
              <TrendingUp color="#16a34a" size={28} />
            </View>
          </View>
        </View>

        {/* Activity Chart */}
        <View className="bg-white rounded-xl p-4 border border-slate-200">
          <Text className="text-sm font-semibold text-slate-700 mb-4">Activity Overview</Text>
          <View className="items-center">
            <BarChart
              data={barData}
              width={280}
              height={150}
              barWidth={50}
              spacing={30}
              noOfSections={4}
              barBorderRadius={6}
              xAxisLabelTextStyle={{ color: '#64748b', fontSize: 12 }}
              yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
              hideRules
              yAxisThickness={0}
              xAxisThickness={0}
            />
          </View>
          <View className="flex-row justify-center gap-6 mt-4">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className="text-xs text-slate-500">Feedstock</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-blue-500" />
              <Text className="text-xs text-slate-500">Production</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-purple-500" />
              <Text className="text-xs text-slate-500">Sequestration</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-sm font-semibold text-slate-700 mt-2">Quick Actions</Text>
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 bg-white rounded-xl p-4 border border-slate-200 active:opacity-80"
            onPress={() => router.push('/feedstock/new')}
          >
            <Leaf color="#22c55e" size={24} />
            <Text className="text-sm font-medium text-slate-900 mt-2">New Feedstock</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-white rounded-xl p-4 border border-slate-200 active:opacity-80"
            onPress={() => router.push('/production/new')}
          >
            <Factory color="#3b82f6" size={24} />
            <Text className="text-sm font-medium text-slate-900 mt-2">New Batch</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-white rounded-xl p-4 border border-slate-200 active:opacity-80"
            onPress={() => router.push('/sequestration/new')}
          >
            <ArrowDownToLine color="#8b5cf6" size={24} />
            <Text className="text-sm font-medium text-slate-900 mt-2">Sequestration</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
