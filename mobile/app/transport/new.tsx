import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { LocationInput } from '@/components/LocationInput';

const VEHICLE_TYPES = [
  { value: 'van', label: 'Van' },
  { value: 'rigid_truck', label: 'Rigid Truck' },
  { value: 'articulated', label: 'Articulated' },
  { value: 'forklift', label: 'Forklift' },
  { value: 'loader', label: 'Loader' },
  { value: 'other', label: 'Other' },
];

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
];

const FUEL_UNITS = [
  { value: 'litres', label: 'Litres' },
  { value: 'kWh', label: 'kWh' },
  { value: 'kg', label: 'kg' },
];

export default function NewTransportScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    vehicleType: 'rigid_truck',
    vehicleDescription: '',
    // Origin
    originAddress: '',
    originLat: null as number | null,
    originLng: null as number | null,
    // Destination
    destinationAddress: '',
    destinationLat: null as number | null,
    destinationLng: null as number | null,
    // Distance & Fuel
    distanceKm: '',
    fuelType: 'diesel',
    fuelAmount: '',
    fuelUnit: 'litres',
    // Cargo
    cargoType: '',
    cargoDescription: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.originAddress.trim()) {
      newErrors.originAddress = 'Origin address is required';
    }
    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = 'Destination address is required';
    }
    if (!formData.distanceKm || parseFloat(formData.distanceKm) <= 0) {
      newErrors.distanceKm = 'Valid distance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        date: data.date,
        vehicleId: data.vehicleId || null,
        vehicleType: data.vehicleType,
        vehicleDescription: data.vehicleDescription || null,
        originAddress: data.originAddress,
        originLat: data.originLat,
        originLng: data.originLng,
        destinationAddress: data.destinationAddress,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
        distanceKm: parseFloat(data.distanceKm),
        fuelType: data.fuelType,
        fuelAmount: data.fuelAmount ? parseFloat(data.fuelAmount) : null,
        fuelUnit: data.fuelUnit,
        cargoType: data.cargoType || null,
        cargoDescription: data.cargoDescription || null,
      };
      return api.transport.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-events'] });
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create transport event');
    },
  });

  const handleSubmit = () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    mutation.mutate(formData);
  };

  const handleOriginSelect = (location: { address: string; lat: number; lng: number }) => {
    setFormData({
      ...formData,
      originAddress: location.address,
      originLat: location.lat,
      originLng: location.lng,
    });
  };

  const handleDestinationSelect = (location: { address: string; lat: number; lng: number }) => {
    setFormData({
      ...formData,
      destinationAddress: location.address,
      destinationLat: location.lat,
      destinationLng: location.lng,
    });
  };

  // Auto-select fuel unit based on fuel type
  const handleFuelTypeChange = (fuelType: string) => {
    let fuelUnit = 'litres';
    if (fuelType === 'electric') {
      fuelUnit = 'kWh';
    } else if (fuelType === 'lpg') {
      fuelUnit = 'kg';
    }
    setFormData({ ...formData, fuelType, fuelUnit });
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
          {/* Basic Info */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Transport Info</Text>

              <Input
                label="Date *"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
              />

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Vehicle Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setFormData({ ...formData, vehicleType: type.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.vehicleType === type.value
                          ? 'bg-slate-700 border-slate-700'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.vehicleType === type.value
                            ? 'text-white font-medium'
                            : 'text-slate-700'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Input
                label="Vehicle Registration"
                value={formData.vehicleId}
                onChangeText={(text) => setFormData({ ...formData, vehicleId: text })}
                placeholder="e.g., AB12 CDE"
              />

              <Input
                label="Vehicle Description"
                value={formData.vehicleDescription}
                onChangeText={(text) => setFormData({ ...formData, vehicleDescription: text })}
                placeholder="Optional details"
              />
            </CardContent>
          </Card>

          {/* Route */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Route</Text>

              <LocationInput
                label="Origin Address *"
                value={formData.originAddress}
                onChangeText={(text) => setFormData({ ...formData, originAddress: text })}
                onLocationSelect={handleOriginSelect}
                placeholder="Where the journey started"
                error={errors.originAddress}
                showGpsButton={true}
              />

              {formData.originLat && formData.originLng && (
                <Text className="text-xs text-green-600">
                  Origin: {formData.originLat.toFixed(4)}, {formData.originLng.toFixed(4)}
                </Text>
              )}

              <LocationInput
                label="Destination Address *"
                value={formData.destinationAddress}
                onChangeText={(text) => setFormData({ ...formData, destinationAddress: text })}
                onLocationSelect={handleDestinationSelect}
                placeholder="Where the journey ended"
                error={errors.destinationAddress}
                showGpsButton={true}
              />

              {formData.destinationLat && formData.destinationLng && (
                <Text className="text-xs text-green-600">
                  Destination: {formData.destinationLat.toFixed(4)}, {formData.destinationLng.toFixed(4)}
                </Text>
              )}

              <Input
                label="Distance (km) *"
                value={formData.distanceKm}
                onChangeText={(text) => setFormData({ ...formData, distanceKm: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.distanceKm}
              />
            </CardContent>
          </Card>

          {/* Fuel */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Fuel</Text>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Fuel Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {FUEL_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => handleFuelTypeChange(type.value)}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.fuelType === type.value
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.fuelType === type.value
                            ? 'text-white font-medium'
                            : 'text-slate-700'
                        }`}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Fuel Amount"
                    value={formData.fuelAmount}
                    onChangeText={(text) => setFormData({ ...formData, fuelAmount: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View className="w-28 gap-1.5">
                  <Text className="text-sm font-medium text-slate-700">Unit</Text>
                  <View className="flex-row gap-1">
                    {FUEL_UNITS.map((unit) => (
                      <Pressable
                        key={unit.value}
                        onPress={() => setFormData({ ...formData, fuelUnit: unit.value })}
                        className={`flex-1 py-2 rounded-lg border items-center ${
                          formData.fuelUnit === unit.value
                            ? 'bg-slate-700 border-slate-700'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            formData.fuelUnit === unit.value
                              ? 'text-white font-medium'
                              : 'text-slate-700'
                          }`}
                        >
                          {unit.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Cargo */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Cargo</Text>

              <Input
                label="Cargo Type"
                value={formData.cargoType}
                onChangeText={(text) => setFormData({ ...formData, cargoType: text })}
                placeholder="e.g., Feedstock, Biochar"
              />

              <Input
                label="Cargo Description"
                value={formData.cargoDescription}
                onChangeText={(text) => setFormData({ ...formData, cargoDescription: text })}
                placeholder="What was transported"
                multiline
                numberOfLines={2}
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
