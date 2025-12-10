import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

const ENERGY_TYPES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'natural_gas', label: 'Natural Gas' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'lpg', label: 'LPG' },
  { value: 'biomass', label: 'Biomass' },
  { value: 'solar', label: 'Solar' },
];

const SCOPES = [
  { value: 'production', label: 'Production' },
  { value: 'storage', label: 'Storage' },
  { value: 'transport', label: 'Transport' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

const UNITS = [
  { value: 'kWh', label: 'kWh' },
  { value: 'litres', label: 'Litres' },
  { value: 'kg', label: 'kg' },
  { value: 'm3', label: 'm³' },
];

export default function NewEnergyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    energyType: 'electricity',
    quantity: '',
    unit: 'kWh',
    scope: 'production',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.energy.create({
      ...data,
      quantity: parseFloat(data.quantity),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-records'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create energy record');
    },
  });

  const handleSubmit = () => {
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Energy Record',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <Card>
            <CardContent className="p-4 gap-4">
              <View className="flex-row gap-3">
                <Input
                  label="Period Start"
                  value={formData.periodStart}
                  onChangeText={(text) => setFormData({ ...formData, periodStart: text })}
                  placeholder="YYYY-MM-DD"
                  containerClassName="flex-1"
                />
                <Input
                  label="Period End"
                  value={formData.periodEnd}
                  onChangeText={(text) => setFormData({ ...formData, periodEnd: text })}
                  placeholder="YYYY-MM-DD"
                  containerClassName="flex-1"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Energy Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {ENERGY_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setFormData({ ...formData, energyType: type.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.energyType === type.value
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.energyType === type.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <Input
                  label="Quantity"
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  containerClassName="flex-2"
                />
                <View className="gap-1.5 flex-1">
                  <Text className="text-sm font-medium text-slate-700">Unit</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {UNITS.map((unit) => (
                      <Pressable
                        key={unit.value}
                        onPress={() => setFormData({ ...formData, unit: unit.value })}
                        className={`px-2 py-1.5 rounded border ${
                          formData.unit === unit.value
                            ? 'bg-slate-700 border-slate-700'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            formData.unit === unit.value ? 'text-white font-medium' : 'text-slate-600'
                          }`}
                        >
                          {unit.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Scope</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SCOPES.map((scope) => (
                    <Pressable
                      key={scope.value}
                      onPress={() => setFormData({ ...formData, scope: scope.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.scope === scope.value
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.scope === scope.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {scope.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Input
                label="Description (optional)"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Additional details"
              />
            </CardContent>
          </Card>
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleSubmit} loading={mutation.isPending}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Energy Record</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
