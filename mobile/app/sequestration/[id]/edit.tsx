import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { api } from '@/services/api';
import { Button, Input, Card, CardContent } from '@/components/ui';

interface SequestrationData {
  id: string;
  finalDeliveryDate: string;
  totalBiocharWeightTonnes: number;
  applicationMethod: string | null;
  siteDescription: string | null;
  gpsCoordinates: string | null;
}

const APPLICATION_METHODS = [
  { value: 'soil_amendment', label: 'Soil Amendment' },
  { value: 'composting', label: 'Composting' },
  { value: 'construction', label: 'Construction' },
  { value: 'water_filtration', label: 'Water Filtration' },
  { value: 'other', label: 'Other' },
];

const CO2E_FACTOR = 3.67;

export default function EditSequestrationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    finalDeliveryDate: '',
    totalBiocharWeightTonnes: '',
    applicationMethod: 'soil_amendment',
    siteDescription: '',
    gpsCoordinates: '',
  });

  const { data: sequestration, isLoading } = useQuery<SequestrationData>({
    queryKey: ['sequestration', id],
    queryFn: () => api.sequestration.get(id!) as Promise<SequestrationData>,
    enabled: !!id,
  });

  useEffect(() => {
    if (sequestration) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        finalDeliveryDate: sequestration.finalDeliveryDate.split('T')[0],
        totalBiocharWeightTonnes: sequestration.totalBiocharWeightTonnes.toString(),
        applicationMethod: sequestration.applicationMethod || 'soil_amendment',
        siteDescription: sequestration.siteDescription || '',
        gpsCoordinates: sequestration.gpsCoordinates || '',
      });
    }
  }, [sequestration]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => api.sequestration.update(id!, {
      ...data,
      totalBiocharWeightTonnes: parseFloat(data.totalBiocharWeightTonnes),
      gpsCoordinates: data.gpsCoordinates || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequestration-events'] });
      queryClient.invalidateQueries({ queryKey: ['sequestration', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update sequestration event');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.sequestration.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequestration-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.replace('/sequestration');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete sequestration event');
    },
  });

  const handleSubmit = () => {
    if (!formData.totalBiocharWeightTonnes || parseFloat(formData.totalBiocharWeightTonnes) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid weight');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sequestration',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  const estimatedCO2e = formData.totalBiocharWeightTonnes
    ? (parseFloat(formData.totalBiocharWeightTonnes) * CO2E_FACTOR).toFixed(2)
    : '0.00';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Sequestration',
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

              <View className="bg-emerald-50 p-3 rounded-lg">
                <Text className="text-xs text-emerald-600">Estimated CO2e Sequestered</Text>
                <Text className="text-lg font-bold text-emerald-700">{estimatedCO2e} tonnes</Text>
              </View>

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
