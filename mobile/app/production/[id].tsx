import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Factory, Scale, Thermometer, Edit, CheckCircle, Clock } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface ProductionDetail {
  id: string;
  serialNumber: string | null;
  productionDate: string;
  status: string;
  inputFeedstockWeightTonnes: number;
  outputBiocharWeightTonnes: number;
  peakTemperatureCelsius: number | null;
  residenceTimeMinutes: number | null;
  feedstockDelivery?: {
    id: string;
    feedstockType: string;
    serialNumber: string | null;
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const isComplete = status === 'complete';
  return (
    <View
      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
        isComplete ? 'bg-green-100' : 'bg-amber-100'
      }`}
    >
      {isComplete ? (
        <CheckCircle color="#22c55e" size={14} />
      ) : (
        <Clock color="#f59e0b" size={14} />
      )}
      <Text
        className={`text-sm font-medium capitalize ${
          isComplete ? 'text-green-700' : 'text-amber-700'
        }`}
      >
        {status}
      </Text>
    </View>
  );
}

export default function ProductionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: batch, isLoading, error } = useQuery<ProductionDetail>({
    queryKey: ['production', id],
    queryFn: () => api.production.get(id!) as Promise<ProductionDetail>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load production batch</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const yieldPercent = batch.inputFeedstockWeightTonnes > 0
    ? (batch.outputBiocharWeightTonnes / batch.inputFeedstockWeightTonnes) * 100
    : 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: batch.serialNumber || 'Production Batch',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/production/[id]/edit', params: { id: id as string } })
              }
              className="ml-4"
            >
              <Edit color="#1e293b" size={20} />
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
                  <View className="h-12 w-12 rounded-xl bg-blue-100 items-center justify-center">
                    <Factory color="#3b82f6" size={24} />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900">
                      {batch.serialNumber || 'No Serial'}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {formatDate(batch.productionDate)}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={batch.status} />
              </View>

              {/* Weight Stats */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500">Input</Text>
                  <Text className="text-lg font-bold text-slate-900">
                    {batch.inputFeedstockWeightTonnes.toFixed(2)}t
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500">Output</Text>
                  <Text className="text-lg font-bold text-slate-900">
                    {batch.outputBiocharWeightTonnes.toFixed(2)}t
                  </Text>
                </View>
                <View className="flex-1 bg-blue-50 rounded-lg p-3">
                  <Text className="text-xs text-blue-600">Yield</Text>
                  <Text className="text-lg font-bold text-blue-600">
                    {yieldPercent.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Process Details */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">Process Details</Text>

              {batch.peakTemperatureCelsius && (
                <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                  <View className="h-8 w-8 rounded-lg bg-orange-100 items-center justify-center">
                    <Thermometer color="#f97316" size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500">Peak Temperature</Text>
                    <Text className="text-sm font-medium text-slate-900">
                      {batch.peakTemperatureCelsius}°C
                    </Text>
                  </View>
                </View>
              )}

              {batch.residenceTimeMinutes && (
                <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                  <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                    <Clock color="#64748b" size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500">Residence Time</Text>
                    <Text className="text-sm font-medium text-slate-900">
                      {batch.residenceTimeMinutes} minutes
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Feedstock Source */}
          {batch.feedstockDelivery && (
            <Card>
              <CardContent className="p-4">
                <Text className="text-sm font-semibold text-slate-700 mb-3">Feedstock Source</Text>
                <Pressable
                  onPress={() => router.push(`/feedstock/${batch.feedstockDelivery!.id}`)}
                  className="flex-row items-center gap-3 active:opacity-70"
                >
                  <View className="h-10 w-10 rounded-lg bg-green-100 items-center justify-center">
                    <Scale color="#22c55e" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-900">
                      {batch.feedstockDelivery.serialNumber || 'Feedstock Delivery'}
                    </Text>
                    <Text className="text-xs text-slate-500 capitalize">
                      {batch.feedstockDelivery.feedstockType.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <ArrowLeft color="#94a3b8" size={16} style={{ transform: [{ rotate: '180deg' }] }} />
                </Pressable>
              </CardContent>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
