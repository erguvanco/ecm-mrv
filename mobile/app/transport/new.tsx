import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
];

export default function NewTransportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    vehicleDescription: '',
    distanceKm: '',
    fuelType: 'diesel',
    fuelAmount: '',
    cargoDescription: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.transport.create({
      ...data,
      distanceKm: parseFloat(data.distanceKm),
      fuelAmount: data.fuelAmount ? parseFloat(data.fuelAmount) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-events'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create transport event');
    },
  });

  const handleSubmit = () => {
    if (!formData.distanceKm || parseFloat(formData.distanceKm) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid distance');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Transport Event',
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
              <Input
                label="Date"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
              />

              <Input
                label="Vehicle ID"
                value={formData.vehicleId}
                onChangeText={(text) => setFormData({ ...formData, vehicleId: text })}
                placeholder="e.g., TRUCK-01"
              />

              <Input
                label="Vehicle Description"
                value={formData.vehicleDescription}
                onChangeText={(text) => setFormData({ ...formData, vehicleDescription: text })}
                placeholder="e.g., Forklift, Loader"
              />

              <Input
                label="Distance (km)"
                value={formData.distanceKm}
                onChangeText={(text) => setFormData({ ...formData, distanceKm: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Fuel Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {FUEL_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setFormData({ ...formData, fuelType: type.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.fuelType === type.value
                          ? 'bg-slate-700 border-slate-700'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.fuelType === type.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Input
                label="Fuel Amount (litres)"
                value={formData.fuelAmount}
                onChangeText={(text) => setFormData({ ...formData, fuelAmount: text })}
                placeholder="Optional"
                keyboardType="decimal-pad"
              />

              <Input
                label="Cargo Description"
                value={formData.cargoDescription}
                onChangeText={(text) => setFormData({ ...formData, cargoDescription: text })}
                placeholder="What was transported"
              />
            </CardContent>
          </Card>
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleSubmit} loading={mutation.isPending}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Transport Event</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
