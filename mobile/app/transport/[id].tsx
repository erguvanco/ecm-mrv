import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Truck, Calendar, Fuel, Route, Edit, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface TransportDetail {
  id: string;
  date: string;
  vehicleId: string | null;
  vehicleDescription: string | null;
  distanceKm: number;
  fuelType: string | null;
  fuelAmount: number | null;
  cargoDescription: string | null;
}

export default function TransportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: transport, isLoading, error } = useQuery<TransportDetail>({
    queryKey: ['transport', id],
    queryFn: () => api.transport.get(id!) as Promise<TransportDetail>,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.transport.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-events'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete transport event');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Transport Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#64748b" />
      </SafeAreaView>
    );
  }

  if (error || !transport) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load transport event</Text>
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
          title: transport.vehicleId || 'Transport Event',
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
                  <View className="h-12 w-12 rounded-xl bg-slate-100 items-center justify-center">
                    <Truck color="#64748b" size={24} />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900">
                      {transport.vehicleId || 'Unknown Vehicle'}
                    </Text>
                    {transport.vehicleDescription && (
                      <Text className="text-sm text-slate-500">
                        {transport.vehicleDescription}
                      </Text>
                    )}
                  </View>
                </View>
                {transport.fuelType && (
                  <Badge variant="secondary">{transport.fuelType}</Badge>
                )}
              </View>

              {/* Stats */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500">Distance</Text>
                  <Text className="text-lg font-bold text-slate-900">
                    {transport.distanceKm.toFixed(1)} km
                  </Text>
                </View>
                {transport.fuelAmount && (
                  <View className="flex-1 bg-amber-50 rounded-lg p-3">
                    <Text className="text-xs text-amber-600">Fuel Used</Text>
                    <Text className="text-lg font-bold text-amber-700">
                      {transport.fuelAmount.toFixed(1)} L
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">Event Details</Text>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Calendar color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Date</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {formatDate(transport.date)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Route color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Distance Traveled</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {transport.distanceKm.toFixed(2)} km
                  </Text>
                </View>
              </View>

              {transport.fuelType && (
                <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                  <View className="h-8 w-8 rounded-lg bg-amber-100 items-center justify-center">
                    <Fuel color="#f59e0b" size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500">Fuel</Text>
                    <Text className="text-sm font-medium text-slate-900 capitalize">
                      {transport.fuelType}
                      {transport.fuelAmount && ` • ${transport.fuelAmount.toFixed(1)} litres`}
                    </Text>
                  </View>
                </View>
              )}

              {transport.cargoDescription && (
                <View className="py-3">
                  <Text className="text-xs text-slate-500 mb-1">Cargo</Text>
                  <Text className="text-sm text-slate-700">
                    {transport.cargoDescription}
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
