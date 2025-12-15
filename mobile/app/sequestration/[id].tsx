import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowDownToLine, Calendar, MapPin, Edit } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface SequestrationDetail {
  id: string;
  serialNumber: string | null;
  finalDeliveryDate: string;
  totalBiocharWeightTonnes: number;
  estimatedCO2eTonnes: number | null;
  applicationMethod: string | null;
  siteDescription: string | null;
  gpsCoordinates: string | null;
}

export default function SequestrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: event, isLoading, error } = useQuery<SequestrationDetail>({
    queryKey: ['sequestration', id],
    queryFn: () => api.sequestration.get(id!) as Promise<SequestrationDetail>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load sequestration event</Text>
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
          title: event.serialNumber || 'Sequestration',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/sequestration/[id]/edit',
                  params: { id: id as string },
                })
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
                  <View className="h-12 w-12 rounded-xl bg-purple-100 items-center justify-center">
                    <ArrowDownToLine color="#8b5cf6" size={24} />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-slate-900">
                      {event.serialNumber || 'No Serial'}
                    </Text>
                    {event.applicationMethod && (
                      <Badge variant="secondary" className="mt-1">
                        {event.applicationMethod.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500">Biochar</Text>
                  <Text className="text-lg font-bold text-slate-900">
                    {event.totalBiocharWeightTonnes.toFixed(2)}t
                  </Text>
                </View>
                <View className="flex-1 bg-emerald-50 rounded-lg p-3">
                  <Text className="text-xs text-emerald-600">CO₂e Sequestered</Text>
                  <Text className="text-lg font-bold text-emerald-600">
                    {event.estimatedCO2eTonnes?.toFixed(2) || '—'}t
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">Application Details</Text>

              <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                  <Calendar color="#64748b" size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">Delivery Date</Text>
                  <Text className="text-sm font-medium text-slate-900">
                    {formatDate(event.finalDeliveryDate)}
                  </Text>
                </View>
              </View>

              {event.siteDescription && (
                <View className="flex-row items-center gap-3 py-3 border-b border-slate-100">
                  <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center">
                    <MapPin color="#64748b" size={16} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-500">Site</Text>
                    <Text className="text-sm font-medium text-slate-900">
                      {event.siteDescription}
                    </Text>
                  </View>
                </View>
              )}

              {event.gpsCoordinates && (
                <View className="py-3">
                  <Text className="text-xs text-slate-500 mb-1">GPS Coordinates</Text>
                  <Text className="text-sm font-mono text-slate-700">
                    {event.gpsCoordinates}
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
