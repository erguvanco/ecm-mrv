import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Zap, Calendar, Gauge, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface EnergyDetail {
  id: string;
  periodStart: string;
  periodEnd: string | null;
  energyType: string;
  quantity: number;
  unit: string;
  scope: string;
  description: string | null;
}

export default function EnergyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: energy, isLoading, error } = useQuery<EnergyDetail>({
    queryKey: ['energy', id],
    queryFn: () => api.energy.get(id!) as Promise<EnergyDetail>,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.energy.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-records'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete energy record');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Energy Record',
      'Are you sure you want to delete this record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  if (error || !energy) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load energy record</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Energy Record',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDelete} className="ml-4">
              <Trash2 color="#ef4444" size={20} />
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
                  <View className="h-12 w-12 rounded-xl bg-amber-100 items-center justify-center">
                    <Zap color="#f59e0b" size={24} />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900 capitalize">
                      {energy.energyType.replace(/_/g, ' ')}
                    </Text>
                    <Badge 
                      variant={energy.scope === 'production' ? 'success' : 'secondary'}
                      className="mt-1"
                    >
                      {energy.scope}
                    </Badge>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View className="bg-amber-50 rounded-lg p-4">
                <Text className="text-xs text-amber-600 mb-1">Energy Consumed</Text>
                <Text className="text-2xl font-bold text-amber-700">
                  {energy.quantity.toLocaleString()} {energy.unit}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">Record Details</Text>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Calendar color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Period</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {formatDate(energy.periodStart)}
                    {energy.periodEnd && ` — ${formatDate(energy.periodEnd)}`}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-amber-100 items-center justify-center">
                  <Gauge color="#f59e0b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Quantity</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {energy.quantity.toLocaleString()} {energy.unit}
                  </Text>
                </View>
              </View>

              <View className="py-3 border-b border-slate-100">
                <Text className="text-xs text-slate-500 mb-1">Scope</Text>
                <Text className="text-sm font-medium text-slate-900 capitalize">
                  {energy.scope}
                </Text>
              </View>

              {energy.description && (
                <View className="py-3">
                  <Text className="text-xs text-slate-500 mb-1">Description</Text>
                  <Text className="text-sm text-slate-700">
                    {energy.description}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}


