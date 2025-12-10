import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Network, MapPin } from 'lucide-react-native';

export default function NetworkScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Network Map' }} />
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6" edges={['bottom']}>
        <View className="h-20 w-20 rounded-2xl bg-cyan-100 items-center justify-center mb-4">
          <Network color="#06b6d4" size={40} />
        </View>
        <Text className="text-xl font-bold text-slate-900 text-center mb-2">
          Supply Chain Map
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-6">
          Visualize your biochar supply chain with interactive maps showing feedstock sources, production facilities, and sequestration sites.
        </Text>
        <View className="bg-slate-100 rounded-xl p-4 w-full">
          <View className="flex-row items-center gap-3">
            <MapPin color="#64748b" size={20} />
            <Text className="text-sm text-slate-600 flex-1">
              Map integration coming soon with react-native-maps
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
