import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Factory } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

export default function NewProductionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    feedstockDeliveryId: '',
    inputFeedstockWeightTonnes: '',
    outputBiocharWeightTonnes: '',
    peakTemperatureCelsius: '',
    residenceTimeMinutes: '',
  });

  const { data: feedstocks = [] } = useQuery({
    queryKey: ['feedstocks'],
    queryFn: () => api.feedstock.list(),
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.production.create({
      ...data,
      inputFeedstockWeightTonnes: parseFloat(data.inputFeedstockWeightTonnes),
      outputBiocharWeightTonnes: parseFloat(data.outputBiocharWeightTonnes),
      peakTemperatureCelsius: data.peakTemperatureCelsius ? parseInt(data.peakTemperatureCelsius) : null,
      residenceTimeMinutes: data.residenceTimeMinutes ? parseInt(data.residenceTimeMinutes) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create production batch');
    },
  });

  const handleNext = () => {
    if (step === 0 && !formData.feedstockDeliveryId) {
      Alert.alert('Required', 'Please select a feedstock source');
      return;
    }
    if (step === 1 && (!formData.inputFeedstockWeightTonnes || !formData.outputBiocharWeightTonnes)) {
      Alert.alert('Required', 'Please enter input and output weights');
      return;
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
                label="Production Date"
                value={formData.productionDate}
                onChangeText={(text) => setFormData({ ...formData, productionDate: text })}
                placeholder="YYYY-MM-DD"
                containerClassName="mb-4"
              />
              <Text className="text-sm font-medium text-slate-700 mb-2">Available Feedstock</Text>
              {feedstocks.length === 0 ? (
                <Text className="text-sm text-slate-500">No feedstock deliveries available</Text>
              ) : (
                <View className="gap-2">
                  {feedstocks.slice(0, 10).map((f: any) => (
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
                        {f.feedstockType.replace(/_/g, ' ')} • {f.weightTonnes.toFixed(1)}t
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
                label="Input Feedstock (tonnes)"
                value={formData.inputFeedstockWeightTonnes}
                onChangeText={(text) => setFormData({ ...formData, inputFeedstockWeightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              <Input
                label="Output Biochar (tonnes)"
                value={formData.outputBiocharWeightTonnes}
                onChangeText={(text) => setFormData({ ...formData, outputBiocharWeightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              {formData.inputFeedstockWeightTonnes && formData.outputBiocharWeightTonnes && (
                <View className="bg-blue-50 p-3 rounded-lg">
                  <Text className="text-sm text-blue-700">
                    Yield: {((parseFloat(formData.outputBiocharWeightTonnes) / parseFloat(formData.inputFeedstockWeightTonnes)) * 100).toFixed(1)}%
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
              <Text className="text-sm font-semibold text-slate-700">Process Parameters (Optional)</Text>
              <Input
                label="Peak Temperature (°C)"
                value={formData.peakTemperatureCelsius}
                onChangeText={(text) => setFormData({ ...formData, peakTemperatureCelsius: text })}
                placeholder="e.g., 550"
                keyboardType="numeric"
              />
              <Input
                label="Residence Time (minutes)"
                value={formData.residenceTimeMinutes}
                onChangeText={(text) => setFormData({ ...formData, residenceTimeMinutes: text })}
                placeholder="e.g., 30"
                keyboardType="numeric"
              />
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
