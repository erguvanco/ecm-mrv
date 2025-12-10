import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Leaf, Calendar, Scale, MapPin, FileText, Edit } from 'lucide-react-native';
import { api } from '@/services/api';
import { Card, CardContent, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface FeedstockDetail {
  id: string;
  serialNumber: string | null;
  date: string;
  feedstockType: string;
  weightTonnes: number;
  moistureContent: number | null;
  sourceDescription: string | null;
  supplierName: string | null;
  evidence?: { id: string; fileName: string }[];
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | number | null; icon?: any }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
      <View className="flex-row items-center gap-2">
        {Icon && <Icon color="#64748b" size={16} />}
        <Text className="text-sm text-slate-500">{label}</Text>
      </View>
      <Text className="text-sm font-medium text-slate-900">{value}</Text>
    </View>
  );
}

export default function FeedstockDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: feedstock, isLoading, error } = useQuery<FeedstockDetail>({
    queryKey: ['feedstock', id],
    queryFn: () => api.feedstock.get(id!) as Promise<FeedstockDetail>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  if (error || !feedstock) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-red-500 text-center">Failed to load feedstock details</Text>
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
          title: feedstock.serialNumber || 'Feedstock',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => router.push(`/feedstock/${id}/edit` as any)} className="ml-4">
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
              <View className="flex-row items-center gap-3 mb-3">
                <View className="h-12 w-12 rounded-xl bg-green-100 items-center justify-center">
                  <Leaf color="#22c55e" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">
                    {feedstock.serialNumber || 'No Serial'}
                  </Text>
                  <Badge variant="success" className="mt-1">
                    {feedstock.feedstockType.replace(/_/g, ' ')}
                  </Badge>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-slate-900">
                    {feedstock.weightTonnes.toFixed(1)}
                  </Text>
                  <Text className="text-xs text-slate-500">tonnes</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-2">Details</Text>
              <DetailRow label="Date" value={formatDate(feedstock.date)} icon={Calendar} />
              <DetailRow label="Weight" value={`${feedstock.weightTonnes.toFixed(2)} tonnes`} icon={Scale} />
              <DetailRow label="Moisture" value={feedstock.moistureContent ? `${feedstock.moistureContent}%` : null} />
              <DetailRow label="Source" value={feedstock.sourceDescription} icon={MapPin} />
              <DetailRow label="Supplier" value={feedstock.supplierName} />

              {feedstock.evidence && feedstock.evidence.length > 0 && (
                <View className="mt-4 pt-4 border-t border-slate-100">
                  <View className="flex-row items-center gap-2 mb-2">
                    <FileText color="#64748b" size={16} />
                    <Text className="text-sm font-medium text-slate-700">
                      Evidence ({feedstock.evidence.length} files)
                    </Text>
                  </View>
                  {feedstock.evidence.map((file) => (
                    <Text key={file.id} className="text-xs text-slate-500 ml-6">
                      {file.fileName}
                    </Text>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
