import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Database, Leaf, Thermometer, MapPin, ChevronRight } from 'lucide-react-native';
import { Card, CardContent } from '@/components/ui';

const datasets = [
  {
    id: 'feedstock-types',
    label: 'Feedstock Types',
    description: 'Biomass categories and properties',
    icon: Leaf,
    color: '#22c55e',
    count: 12,
  },
  {
    id: 'emission-factors',
    label: 'Emission Factors',
    description: 'GHG coefficients by source',
    icon: Thermometer,
    color: '#f59e0b',
    count: 45,
  },
  {
    id: 'locations',
    label: 'Locations',
    description: 'Registered sites and facilities',
    icon: MapPin,
    color: '#3b82f6',
    count: 8,
  },
];

export default function DatasetsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Datasets' }} />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-12 w-12 rounded-xl bg-blue-100 items-center justify-center">
              <Database color="#3b82f6" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">Reference Data</Text>
              <Text className="text-xs text-slate-500">
                Manage system datasets and configurations
              </Text>
            </View>
          </View>

          <Card>
            <CardContent className="p-0">
              {datasets.map((dataset, index) => {
                const Icon = dataset.icon;
                return (
                  <Pressable
                    key={dataset.id}
                    className={`flex-row items-center p-4 active:bg-slate-50 ${
                      index < datasets.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <View
                      className="h-10 w-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: `${dataset.color}15` }}
                    >
                      <Icon color={dataset.color} size={20} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-900">{dataset.label}</Text>
                      <Text className="text-xs text-slate-500">{dataset.description}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-slate-400">{dataset.count} items</Text>
                      <ChevronRight color="#94a3b8" size={16} />
                    </View>
                  </Pressable>
                );
              })}
            </CardContent>
          </Card>

          <Text className="text-xs text-slate-400 text-center mt-6">
            Dataset management is available in the web application
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
