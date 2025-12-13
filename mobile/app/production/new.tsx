import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

interface FeedstockOption {
  id: string;
  serialNumber: string | null;
  feedstockType: string;
  weightTonnes: number;
}

export default function NewProductionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    feedstockDeliveryId: '',
    inputFeedstockWeightTonnes: '',
    outputBiocharWeightTonnes: '',
    // Temperature fields (updated from single peak temp)
    temperatureMin: '',
    temperatureMax: '',
    temperatureAvg: '',
    residenceTimeMinutes: '',
  });

  const { data: feedstocks = [] } = useQuery<FeedstockOption[]>({
    queryKey: ['feedstocks'],
    queryFn: () => api.feedstock.list(),
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        productionDate: data.productionDate,
        feedstockDeliveryId: data.feedstockDeliveryId || null,
        inputFeedstockWeightTonnes: parseFloat(data.inputFeedstockWeightTonnes),
        outputBiocharWeightTonnes: parseFloat(data.outputBiocharWeightTonnes),
        temperatureMin: data.temperatureMin ? parseInt(data.temperatureMin) : null,
        temperatureMax: data.temperatureMax ? parseInt(data.temperatureMax) : null,
        temperatureAvg: data.temperatureAvg ? parseInt(data.temperatureAvg) : null,
        residenceTimeMinutes: data.residenceTimeMinutes ? parseInt(data.residenceTimeMinutes) : null,
      };
      return api.production.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create production batch');
    },
  });

  const handleNext = () => {
    if (step === 0 && !formData.feedstockDeliveryId) {
      Alert.alert('Required', 'Please select a feedstock source');
      return;
    }
    if (step === 1) {
      if (!formData.inputFeedstockWeightTonnes || parseFloat(formData.inputFeedstockWeightTonnes) <= 0) {
        Alert.alert('Required', 'Please enter input weight');
        return;
      }
      if (!formData.outputBiocharWeightTonnes || parseFloat(formData.outputBiocharWeightTonnes) <= 0) {
        Alert.alert('Required', 'Please enter output weight');
        return;
      }
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      mutation.mutate(formData);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-slate-700 mb-3">Select Feedstock Source</Text>
              <Input
                label="Production Date *"
                value={formData.productionDate}
                onChangeText={(text) => setFormData({ ...formData, productionDate: text })}
                placeholder="YYYY-MM-DD"
                containerClassName="mb-4"
              />
              <Text className="text-sm font-medium text-slate-700 mb-2">Available Feedstock *</Text>
              {feedstocks.length === 0 ? (
                <View className="p-4 bg-amber-50 rounded-lg">
                  <Text className="text-sm text-amber-700">
                    No feedstock deliveries available. Please add feedstock first.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {feedstocks.slice(0, 10).map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => setFormData({ ...formData, feedstockDeliveryId: f.id })}
                      className={`p-3 rounded-lg border ${
                        formData.feedstockDeliveryId === f.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className="text-sm font-medium text-slate-900">
                        {f.serialNumber || 'No Serial'}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {f.feedstockType.replace(/_/g, ' ')} - {f.weightTonnes.toFixed(1)}t
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardContent className="p-4 gap-4">
              <Text className="text-sm font-semibold text-slate-700">Input & Output</Text>
              <Input
                label="Input Feedstock (tonnes) *"
                value={formData.inputFeedstockWeightTonnes}
                onChangeText={(text) => setFormData({ ...formData, inputFeedstockWeightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Input
                label="Output Biochar (tonnes) *"
                value={formData.outputBiocharWeightTonnes}
                onChangeText={(text) => setFormData({ ...formData, outputBiocharWeightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              {formData.inputFeedstockWeightTonnes && formData.outputBiocharWeightTonnes && (
                <View className="bg-blue-50 p-3 rounded-lg">
                  <Text className="text-sm text-blue-700">
                    Yield: {(() => {
                      const input = parseFloat(formData.inputFeedstockWeightTonnes);
                      const output = parseFloat(formData.outputBiocharWeightTonnes);
                      if (isNaN(input) || isNaN(output) || input === 0) return '—';
                      return ((output / input) * 100).toFixed(1) + '%';
                    })()}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardContent className="p-4 gap-4">
              <Text className="text-sm font-semibold text-slate-700">Process Parameters</Text>
              <Text className="text-xs text-slate-500">
                Temperature values help calculate biochar quality metrics
              </Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Min Temp (°C)"
                    value={formData.temperatureMin}
                    onChangeText={(text) => setFormData({ ...formData, temperatureMin: text })}
                    placeholder="300"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Max Temp (°C)"
                    value={formData.temperatureMax}
                    onChangeText={(text) => setFormData({ ...formData, temperatureMax: text })}
                    placeholder="700"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Avg Temp (°C)"
                    value={formData.temperatureAvg}
                    onChangeText={(text) => setFormData({ ...formData, temperatureAvg: text })}
                    placeholder="550"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label="Residence Time (minutes)"
                value={formData.residenceTimeMinutes}
                onChangeText={(text) => setFormData({ ...formData, residenceTimeMinutes: text })}
                placeholder="e.g., 30"
                keyboardType="numeric"
              />

              {formData.temperatureMin && formData.temperatureMax && (
                <View className="bg-slate-50 p-3 rounded-lg">
                  <Text className="text-xs text-slate-600">
                    Temperature range: {formData.temperatureMin}°C - {formData.temperatureMax}°C
                    {formData.temperatureAvg && ` (avg: ${formData.temperatureAvg}°C)`}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Production Batch',
          headerLeft: () => (
            <Pressable onPress={() => step > 0 ? setStep(step - 1) : router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        {/* Progress */}
        <View className="flex-row px-4 py-3 gap-2">
          {[0, 1, 2].map((s) => (
            <View
              key={s}
              className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-slate-200'}`}
            />
          ))}
        </View>
        <Text className="px-4 text-xs text-slate-500 mb-2">
          Step {step + 1} of 3: {['Feedstock', 'Weights', 'Process'][step]}
        </Text>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {renderStep()}
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleNext} loading={mutation.isPending}>
            <View className="flex-row items-center gap-2">
              {step < 2 ? (
                <>
                  <Text className="text-white font-medium">Next</Text>
                  <ArrowRight color="white" size={18} />
                </>
              ) : (
                <>
                  <Check color="white" size={18} />
                  <Text className="text-white font-medium">Create Batch</Text>
                </>
              )}
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
