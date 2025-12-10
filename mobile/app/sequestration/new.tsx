import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

const APPLICATION_METHODS = [
  { value: 'soil_amendment', label: 'Soil Amendment' },
  { value: 'composting', label: 'Composting' },
  { value: 'construction', label: 'Construction' },
  { value: 'water_filtration', label: 'Water Filtration' },
  { value: 'other', label: 'Other' },
];

export default function NewSequestrationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    finalDeliveryDate: new Date().toISOString().split('T')[0],
    totalBiocharWeightTonnes: '',
    applicationMethod: 'soil_amendment',
    siteDescription: '',
    gpsCoordinates: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.sequestration.create({
      ...data,
      totalBiocharWeightTonnes: parseFloat(data.totalBiocharWeightTonnes),
      gpsCoordinates: data.gpsCoordinates || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequestration-events'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create sequestration event');
    },
  });

  const handleSubmit = () => {
    if (!formData.totalBiocharWeightTonnes || parseFloat(formData.totalBiocharWeightTonnes) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid weight');
      return;
    }
    mutation.mutate(formData);
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
          <Card>
            <CardContent className="p-4 gap-4">
              <Input
                label="Delivery Date"
                value={formData.finalDeliveryDate}
                onChangeText={(text) => setFormData({ ...formData, finalDeliveryDate: text })}
                placeholder="YYYY-MM-DD"
              />

              <Input
                label="Biochar Weight (tonnes)"
                value={formData.totalBiocharWeightTonnes}
                onChangeText={(text) => setFormData({ ...formData, totalBiocharWeightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Application Method</Text>
                <View className="flex-row flex-wrap gap-2">
                  {APPLICATION_METHODS.map((method) => (
                    <Pressable
                      key={method.value}
                      onPress={() => setFormData({ ...formData, applicationMethod: method.value })}
                      className={`px-3 py-2 rounded-lg border ${
                        formData.applicationMethod === method.value
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.applicationMethod === method.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {method.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Input
                label="Site Description"
                value={formData.siteDescription}
                onChangeText={(text) => setFormData({ ...formData, siteDescription: text })}
                placeholder="Where the biochar was applied"
              />

              <Input
                label="GPS Coordinates (optional)"
                value={formData.gpsCoordinates}
                onChangeText={(text) => setFormData({ ...formData, gpsCoordinates: text })}
                placeholder="e.g., -6.200000, 106.816666"
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
