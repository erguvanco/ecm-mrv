import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Calculator, FileCheck } from 'lucide-react-native';

export default function LCAScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'LCA & Verification' }} />
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center p-6" edges={['bottom']}>
        <View className="h-20 w-20 rounded-2xl bg-purple-100 items-center justify-center mb-4">
          <Calculator color="#8b5cf6" size={40} />
        </View>
        <Text className="text-xl font-bold text-slate-900 text-center mb-2">
          Lifecycle Assessment
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-6">
          Calculate carbon footprint and verify emissions data for your biochar production process.
        </Text>
        <View className="bg-slate-100 rounded-xl p-4 w-full">
          <View className="flex-row items-center gap-3">
            <FileCheck color="#64748b" size={20} />
            <Text className="text-sm text-slate-600 flex-1">
              LCA calculations and verification reports available in web app
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
