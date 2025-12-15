import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { LocationInput } from '@/components/LocationInput';
import { PhotoCapture } from '@/components/PhotoCapture';

const FEEDSTOCK_TYPE_GROUPS = [
  {
    label: 'Agricultural Residues',
    options: [
      { value: 'wheat_straw', label: 'Wheat straw' },
      { value: 'corn_stover', label: 'Corn stover' },
      { value: 'rice_husk', label: 'Rice husk' },
      { value: 'hazelnut_shells', label: 'Hazelnut shells' },
      { value: 'cotton_stalks', label: 'Cotton stalks' },
    ],
  },
  {
    label: 'Forestry & Wood',
    options: [
      { value: 'wood_chips', label: 'Wood chips' },
      { value: 'sawdust', label: 'Sawdust' },
      { value: 'bark', label: 'Bark' },
      { value: 'logging_residues', label: 'Logging residues' },
    ],
  },
  {
    label: 'Organic & Food Waste',
    options: [
      { value: 'food_waste', label: 'Food waste' },
      { value: 'brewery_spent_grain', label: 'Brewery spent grain' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: 'other', label: 'Other' },
    ],
  },
];

const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'electric', label: 'Electric' },
  { value: 'biodiesel', label: 'Biodiesel' },
  { value: 'other', label: 'Other' },
];

export default function NewFeedstockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Agricultural Residues');
  const [isUploading, setIsUploading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    // Vehicle info (required)
    vehicleId: '',
    vehicleDescription: '',
    // Feedstock details (required)
    feedstockType: 'wood_chips',
    weightTonnes: '',
    // Source location (required)
    sourceAddress: '',
    sourceLat: null as number | null,
    sourceLng: null as number | null,
    // Transport fuel (required)
    fuelType: 'diesel',
    fuelAmount: '',
    deliveryDistanceKm: '',
    // Optional fields
    volumeM3: '',
    notes: '',
    // Photo
    truckPhotoUri: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle registration is required';
    }
    if (!formData.vehicleDescription.trim()) {
      newErrors.vehicleDescription = 'Vehicle description is required';
    }
    if (!formData.weightTonnes || parseFloat(formData.weightTonnes) <= 0) {
      newErrors.weightTonnes = 'Valid weight is required';
    }
    if (!formData.sourceAddress.trim()) {
      newErrors.sourceAddress = 'Source address is required';
    }
    if (!formData.fuelAmount || parseFloat(formData.fuelAmount) <= 0) {
      newErrors.fuelAmount = 'Fuel amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        date: data.date,
        vehicleId: data.vehicleId,
        vehicleDescription: data.vehicleDescription,
        feedstockType: data.feedstockType,
        weightTonnes: parseFloat(data.weightTonnes),
        sourceAddress: data.sourceAddress,
        sourceLat: data.sourceLat,
        sourceLng: data.sourceLng,
        fuelType: data.fuelType,
        fuelAmount: parseFloat(data.fuelAmount),
        deliveryDistanceKm: data.deliveryDistanceKm ? parseFloat(data.deliveryDistanceKm) : 0,
        volumeM3: data.volumeM3 ? parseFloat(data.volumeM3) : null,
        notes: data.notes || null,
      };
      return api.feedstock.create(payload);
    },
    onSuccess: async (result: { id: string }) => {
      setCreatedId(result.id);

      // Upload photo if one was selected
      if (formData.truckPhotoUri && result.id) {
        setIsUploading(true);
        try {
          await api.feedstock.uploadTruckPhoto(result.id, formData.truckPhotoUri);
        } catch (err) {
          console.error('Photo upload failed:', err);
          // Don't block success - photo is optional
        }
        setIsUploading(false);
      }

      queryClient.invalidateQueries({ queryKey: ['feedstocks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create feedstock delivery');
    },
  });

  const handleSubmit = () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    mutation.mutate(formData);
  };

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setFormData({
      ...formData,
      sourceAddress: location.address,
      sourceLat: location.lat,
      sourceLng: location.lng,
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Feedstock Delivery',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Delivery Info */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Delivery Info</Text>

              <Input
                label="Date *"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
              />

              <Input
                label="Vehicle Registration *"
                value={formData.vehicleId}
                onChangeText={(text) => setFormData({ ...formData, vehicleId: text })}
                placeholder="e.g., AB12 CDE"
                error={errors.vehicleId}
              />

              <Input
                label="Vehicle Description *"
                value={formData.vehicleDescription}
                onChangeText={(text) => setFormData({ ...formData, vehicleDescription: text })}
                placeholder="e.g., 18t Rigid Truck"
                error={errors.vehicleDescription}
              />
            </CardContent>
          </Card>

          {/* Feedstock Details */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Feedstock Details</Text>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Feedstock Type *</Text>
                {FEEDSTOCK_TYPE_GROUPS.map((group) => (
                  <View key={group.label} className="border border-slate-200 rounded-lg overflow-hidden">
                    <Pressable
                      onPress={() => toggleGroup(group.label)}
                      className="flex-row items-center justify-between px-3 py-2 bg-slate-50"
                    >
                      <Text className="text-sm font-medium text-slate-600">{group.label}</Text>
                      {expandedGroup === group.label ? (
                        <ChevronUp size={16} color="#64748b" />
                      ) : (
                        <ChevronDown size={16} color="#64748b" />
                      )}
                    </Pressable>
                    {expandedGroup === group.label && (
                      <View className="p-2 flex-row flex-wrap gap-2">
                        {group.options.map((type) => (
                          <Pressable
                            key={type.value}
                            onPress={() => setFormData({ ...formData, feedstockType: type.value })}
                            className={`px-3 py-2 rounded-lg border ${
                              formData.feedstockType === type.value
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <Text
                              className={`text-sm ${
                                formData.feedstockType === type.value ? 'text-white font-medium' : 'text-slate-700'
                              }`}
                            >
                              {type.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <Input
                label="Weight (tonnes) *"
                value={formData.weightTonnes}
                onChangeText={(text) => setFormData({ ...formData, weightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.weightTonnes}
              />

              <Input
                label="Volume (m3)"
                value={formData.volumeM3}
                onChangeText={(text) => setFormData({ ...formData, volumeM3: text })}
                placeholder="Optional"
                keyboardType="decimal-pad"
              />
            </CardContent>
          </Card>

          {/* Source Location */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Source Location</Text>

              <LocationInput
                label="Source Address *"
                value={formData.sourceAddress}
                onChangeText={(text) => setFormData({ ...formData, sourceAddress: text })}
                onLocationSelect={handleLocationSelect}
                placeholder="Search or use GPS"
                error={errors.sourceAddress}
                showGpsButton={true}
              />

              {formData.sourceLat && formData.sourceLng && (
                <Text className="text-xs text-green-600">
                  Location captured: {formData.sourceLat.toFixed(4)}, {formData.sourceLng.toFixed(4)}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Transport */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Transport</Text>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Fuel Type *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {FUEL_TYPES.map((fuel) => (
                    <Pressable
                      key={fuel.value}
                      onPress={() => setFormData({ ...formData, fuelType: fuel.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.fuelType === fuel.value
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.fuelType === fuel.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {fuel.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Input
                label="Fuel Amount (litres) *"
                value={formData.fuelAmount}
                onChangeText={(text) => setFormData({ ...formData, fuelAmount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.fuelAmount}
              />

              <Input
                label="Distance (km)"
                value={formData.deliveryDistanceKm}
                onChangeText={(text) => setFormData({ ...formData, deliveryDistanceKm: text })}
                placeholder="Auto-calculated if GPS used"
                keyboardType="decimal-pad"
              />
            </CardContent>
          </Card>

          {/* Photo */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Truck Photo</Text>

              <PhotoCapture
                label="Arrival Photo (optional)"
                value={formData.truckPhotoUri}
                onPhotoSelect={(uri) => setFormData({ ...formData, truckPhotoUri: uri || '' })}
                placeholder="Take or select truck arrival photo"
                isUploading={isUploading}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Input
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
              />
            </CardContent>
          </Card>
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleSubmit} loading={mutation.isPending || isUploading}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Feedstock Delivery</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
