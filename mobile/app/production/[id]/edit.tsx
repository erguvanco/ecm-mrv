import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

interface ProductionData {
  id: string;
  productionDate: string;
  status: string;
  inputFeedstockWeightTonnes: number;
  outputBiocharWeightTonnes: number;
  peakTemperatureCelsius: number | null;
  residenceTimeMinutes: number | null;
  feedstockDeliveryId: string | null;
}

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
];

export default function EditProductionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    productionDate: '',
    status: 'in_progress',
    inputFeedstockWeightTonnes: '',
    outputBiocharWeightTonnes: '',
    peakTemperatureCelsius: '',
    residenceTimeMinutes: '',
  });

  const { data: production, isLoading } = useQuery<ProductionData>({
    queryKey: ['production', id],
    queryFn: () => api.production.get(id!) as Promise<ProductionData>,
    enabled: !!id,
  });

  useEffect(() => {
    if (production) {
      setFormData({
        productionDate: production.productionDate.split('T')[0],
        status: production.status,
        inputFeedstockWeightTonnes: production.inputFeedstockWeightTonnes.toString(),
        outputBiocharWeightTonnes: production.outputBiocharWeightTonnes.toString(),
        peakTemperatureCelsius: production.peakTemperatureCelsius?.toString() || '',
        residenceTimeMinutes: production.residenceTimeMinutes?.toString() || '',
      });
    }
  }, [production]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => api.production.update(id!, {
      ...data,
      inputFeedstockWeightTonnes: parseFloat(data.inputFeedstockWeightTonnes),
      outputBiocharWeightTonnes: parseFloat(data.outputBiocharWeightTonnes),
      peakTemperatureCelsius: data.peakTemperatureCelsius ? parseInt(data.peakTemperatureCelsius) : null,
      residenceTimeMinutes: data.residenceTimeMinutes ? parseInt(data.residenceTimeMinutes) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      queryClient.invalidateQueries({ queryKey: ['production', id] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update production batch');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.production.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-batches'] });
      router.replace('/production' as any);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete production batch');
    },
  });

  const handleSubmit = () => {
    if (!formData.inputFeedstockWeightTonnes || !formData.outputBiocharWeightTonnes) {
      Alert.alert('Validation Error', 'Please enter input and output weights');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Production Batch',
      'Are you sure you want to delete this batch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  const yieldPercent = formData.inputFeedstockWeightTonnes && formData.outputBiocharWeightTonnes
    ? ((parseFloat(formData.outputBiocharWeightTonnes) / parseFloat(formData.inputFeedstockWeightTonnes)) * 100).toFixed(1)
    : '0';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Production',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleDelete} className="ml-4">
              <Trash2 color="#ef4444" size={20} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <Card className="mb-4">
            <CardContent className="p-4 gap-4">
              <Text className="text-sm font-semibold text-slate-700">Batch Details</Text>

              <Input
                label="Production Date"
                value={formData.productionDate}
                onChangeText={(text) => setFormData({ ...formData, productionDate: text })}
                placeholder="YYYY-MM-DD"
              />

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-slate-700">Status</Text>
                <View className="flex-row gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setFormData({ ...formData, status: option.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        formData.status === option.value
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm text-center ${
                          formData.status === option.value ? 'text-white font-medium' : 'text-slate-700'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-4">
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

              <View className="bg-blue-50 p-3 rounded-lg">
                <Text className="text-sm text-blue-700">Yield: {yieldPercent}%</Text>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 gap-4">
              <Text className="text-sm font-semibold text-slate-700">Process Parameters</Text>

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
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
          <Button onPress={handleSubmit} loading={updateMutation.isPending}>
            <View className="flex-row items-center gap-2">
              <Save color="white" size={18} />
              <Text className="text-white font-medium">Save Changes</Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
