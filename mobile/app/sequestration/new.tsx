import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { LocationInput } from '@/components/LocationInput';

const SEQUESTRATION_TYPES = [
  { value: 'soil', label: 'Soil Amendment' },
  { value: 'compost', label: 'Compost Blend' },
  { value: 'construction', label: 'Construction' },
  { value: 'filtration', label: 'Filtration' },
  { value: 'other', label: 'Other' },
];

const STORAGE_CONDITIONS = [
  { value: 'Indoor', label: 'Indoor' },
  { value: 'Outdoor', label: 'Outdoor' },
  { value: 'Covered', label: 'Covered Outdoor' },
];

interface BatchAllocation {
  productionBatchId: string;
  quantityTonnes: string;
  serialNumber: string;
}

export default function NewSequestrationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    finalDeliveryDate: new Date().toISOString().split('T')[0],
    // Required fields
    deliveryPostcode: '',
    sequestrationType: 'soil',
    // Storage fields
    storageBeforeDelivery: false,
    storageLocation: '',
    storageContainerIds: '',
    storageConditions: 'Indoor',
    // Location
    destinationAddress: '',
    destinationLat: null as number | null,
    destinationLng: null as number | null,
    // Optional
    notes: '',
  });

  const [batchAllocations, setBatchAllocations] = useState<BatchAllocation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available production batches
  const { data: productionBatches = [] } = useQuery({
    queryKey: ['production-batches'],
    queryFn: () => api.production.list(),
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deliveryPostcode.trim()) {
      newErrors.deliveryPostcode = 'Delivery postcode is required';
    }
    if (!formData.sequestrationType) {
      newErrors.sequestrationType = 'Sequestration type is required';
    }
    if (formData.storageBeforeDelivery && !formData.storageContainerIds.trim()) {
      newErrors.storageContainerIds = 'Container IDs are required when storage is used';
    }
    if (batchAllocations.length === 0) {
      newErrors.batches = 'At least one production batch must be linked';
    }
    const totalQuantity = batchAllocations.reduce(
      (sum, b) => sum + (parseFloat(b.quantityTonnes) || 0),
      0
    );
    if (totalQuantity <= 0) {
      newErrors.batches = 'Total quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        finalDeliveryDate: data.finalDeliveryDate,
        deliveryPostcode: data.deliveryPostcode,
        sequestrationType: data.sequestrationType,
        storageBeforeDelivery: data.storageBeforeDelivery,
        storageLocation: data.storageLocation || null,
        storageContainerIds: data.storageContainerIds || null,
        storageConditions: data.storageConditions || null,
        destinationLat: data.destinationLat,
        destinationLng: data.destinationLng,
        notes: data.notes || null,
        // Batch allocations
        batches: batchAllocations.map((b) => ({
          productionBatchId: b.productionBatchId,
          quantityTonnes: parseFloat(b.quantityTonnes),
        })),
      };
      return api.sequestration.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequestration-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create sequestration event');
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
      destinationAddress: location.address,
      destinationLat: location.lat,
      destinationLng: location.lng,
    });
  };

  const addBatchAllocation = () => {
    if (productionBatches.length === 0) {
      Alert.alert('No Batches', 'No production batches available to link');
      return;
    }
    const availableBatches = productionBatches.filter(
      (b) => !batchAllocations.find((a) => a.productionBatchId === b.id)
    );
    if (availableBatches.length === 0) {
      Alert.alert('All Added', 'All production batches have been added');
      return;
    }
    const batch = availableBatches[0];
    setBatchAllocations([
      ...batchAllocations,
      {
        productionBatchId: batch.id,
        quantityTonnes: '',
        serialNumber: batch.serialNumber || batch.id.slice(0, 8),
      },
    ]);
  };

  const removeBatchAllocation = (index: number) => {
    setBatchAllocations(batchAllocations.filter((_, i) => i !== index));
  };

  const updateBatchAllocation = (index: number, field: keyof BatchAllocation, value: string) => {
    const updated = [...batchAllocations];
    updated[index] = { ...updated[index], [field]: value };
    setBatchAllocations(updated);
  };

  const selectBatchForAllocation = (index: number, batchId: string) => {
    const batch = productionBatches.find((b) => b.id === batchId);
    if (batch) {
      const updated = [...batchAllocations];
      updated[index] = {
        ...updated[index],
        productionBatchId: batchId,
        serialNumber: batch.serialNumber || batch.id.slice(0, 8),
      };
      setBatchAllocations(updated);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Sequestration',
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
                label="Delivery Date *"
                value={formData.finalDeliveryDate}
                onChangeText={(text) => setFormData({ ...formData, finalDeliveryDate: text })}
                placeholder="YYYY-MM-DD"
              />

              <Input
                label="Delivery Postcode *"
                value={formData.deliveryPostcode}
                onChangeText={(text) => setFormData({ ...formData, deliveryPostcode: text })}
                placeholder="e.g., SW1A 1AA"
                error={errors.deliveryPostcode}
              />

              <LocationInput
                label="Destination Address"
                value={formData.destinationAddress}
                onChangeText={(text) => setFormData({ ...formData, destinationAddress: text })}
                onLocationSelect={handleLocationSelect}
                placeholder="Search or use GPS for precise location"
                showGpsButton={true}
              />

              {formData.destinationLat && formData.destinationLng && (
                <Text className="text-xs text-green-600">
                  Location: {formData.destinationLat.toFixed(4)}, {formData.destinationLng.toFixed(4)}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Sequestration Type */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Sequestration Type</Text>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Type *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SEQUESTRATION_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setFormData({ ...formData, sequestrationType: type.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.sequestrationType === type.value
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.sequestrationType === type.value
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
            </CardContent>
          </Card>

          {/* Storage */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-base font-semibold text-slate-800">Storage Details</Text>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-slate-700">Storage before delivery?</Text>
                <Switch
                  value={formData.storageBeforeDelivery}
                  onValueChange={(value) =>
                    setFormData({ ...formData, storageBeforeDelivery: value })
                  }
                  trackColor={{ false: '#e2e8f0', true: '#a855f7' }}
                  thumbColor={formData.storageBeforeDelivery ? '#7c3aed' : '#f1f5f9'}
                />
              </View>

              {formData.storageBeforeDelivery && (
                <>
                  <Input
                    label="Storage Location"
                    value={formData.storageLocation}
                    onChangeText={(text) => setFormData({ ...formData, storageLocation: text })}
                    placeholder="Where biochar was stored"
                  />

                  <Input
                    label="Container IDs *"
                    value={formData.storageContainerIds}
                    onChangeText={(text) => setFormData({ ...formData, storageContainerIds: text })}
                    placeholder="e.g., BC-001, BC-002"
                    error={errors.storageContainerIds}
                  />

                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-slate-700">Storage Conditions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {STORAGE_CONDITIONS.map((cond) => (
                        <Pressable
                          key={cond.value}
                          onPress={() =>
                            setFormData({ ...formData, storageConditions: cond.value })
                          }
                          className={`px-3 py-2 rounded-lg border ${
                            formData.storageConditions === cond.value
                              ? 'bg-slate-700 border-slate-700'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              formData.storageConditions === cond.value
                                ? 'text-white font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {cond.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </CardContent>
          </Card>

          {/* Production Batch Linkage */}
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-800">Production Batches *</Text>
                <Pressable
                  onPress={addBatchAllocation}
                  className="flex-row items-center gap-1 px-3 py-1.5 bg-purple-500 rounded-lg"
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white text-sm font-medium">Add</Text>
                </Pressable>
              </View>

              {errors.batches && (
                <Text className="text-xs text-red-500">{errors.batches}</Text>
              )}

              {batchAllocations.length === 0 ? (
                <Text className="text-sm text-slate-500 text-center py-4">
                  No batches linked. Tap "Add" to link production batches.
                </Text>
              ) : (
                batchAllocations.map((allocation, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-2 p-3 bg-slate-50 rounded-lg"
                  >
                    <View className="flex-1 gap-2">
                      <View className="gap-1">
                        <Text className="text-xs text-slate-500">Batch</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="max-h-10"
                        >
                          <View className="flex-row gap-1">
                            {productionBatches
                              .filter(
                                (b) =>
                                  b.id === allocation.productionBatchId ||
                                  !batchAllocations.find((a) => a.productionBatchId === b.id)
                              )
                              .slice(0, 5)
                              .map((batch) => (
                                <Pressable
                                  key={batch.id}
                                  onPress={() => selectBatchForAllocation(index, batch.id)}
                                  className={`px-2 py-1 rounded border ${
                                    allocation.productionBatchId === batch.id
                                      ? 'bg-purple-100 border-purple-500'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <Text className="text-xs">
                                    {batch.serialNumber || batch.id.slice(0, 8)}
                                  </Text>
                                </Pressable>
                              ))}
                          </View>
                        </ScrollView>
                      </View>
                      <Input
                        label="Quantity (tonnes)"
                        value={allocation.quantityTonnes}
                        onChangeText={(text) =>
                          updateBatchAllocation(index, 'quantityTonnes', text)
                        }
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        containerClassName="flex-1"
                      />
                    </View>
                    <Pressable
                      onPress={() => removeBatchAllocation(index)}
                      className="p-2 bg-red-100 rounded-lg"
                    >
                      <Minus size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                ))
              )}

              {batchAllocations.length > 0 && (
                <View className="pt-2 border-t border-slate-200">
                  <Text className="text-sm font-medium text-slate-700">
                    Total:{' '}
                    {batchAllocations
                      .reduce((sum, b) => sum + (parseFloat(b.quantityTonnes) || 0), 0)
                      .toFixed(2)}{' '}
                    tonnes
                  </Text>
                </View>
              )}
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
          <Button onPress={handleSubmit} loading={mutation.isPending}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Sequestration</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
