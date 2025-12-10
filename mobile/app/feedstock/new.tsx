import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

const FEEDSTOCK_TYPES = [
  { value: 'wood_chips', label: 'Wood Chips' },
  { value: 'rice_husks', label: 'Rice Husks' },
  { value: 'coconut_shells', label: 'Coconut Shells' },
  { value: 'bamboo', label: 'Bamboo' },
  { value: 'agricultural_residue', label: 'Agricultural Residue' },
  { value: 'other', label: 'Other' },
];

export default function NewFeedstockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    feedstockType: 'wood_chips',
    weightTonnes: '',
    moistureContent: '',
    sourceDescription: '',
    supplierName: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => api.feedstock.create({
      ...data,
      weightTonnes: parseFloat(data.weightTonnes),
      moistureContent: data.moistureContent ? parseFloat(data.moistureContent) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedstocks'] });
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to create feedstock delivery');
    },
  });

  const handleSubmit = () => {
    if (!formData.weightTonnes || parseFloat(formData.weightTonnes) <= 0) {
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
          title: 'New Feedstock',
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

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Feedstock Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {FEEDSTOCK_TYPES.map((type) => (
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
              </View>

              <Input
                label="Weight (tonnes)"
                value={formData.weightTonnes}
                onChangeText={(text) => setFormData({ ...formData, weightTonnes: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Input
                label="Moisture Content (%)"
                value={formData.moistureContent}
                onChangeText={(text) => setFormData({ ...formData, moistureContent: text })}
                placeholder="Optional"
                keyboardType="decimal-pad"
              />

              <Input
                label="Source Description"
                value={formData.sourceDescription}
                onChangeText={(text) => setFormData({ ...formData, sourceDescription: text })}
                placeholder="Where the feedstock came from"
              />

              <Input
                label="Supplier Name"
                value={formData.supplierName}
                onChangeText={(text) => setFormData({ ...formData, supplierName: text })}
                placeholder="Optional"
              />
            </CardContent>
          </Card>
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleSubmit} loading={mutation.isPending}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Feedstock</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
