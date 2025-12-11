import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import WebView from 'react-native-webview';
import { Calculator } from 'lucide-react-native';

export default function LCAScreen() {
  const webBase =
    process.env.EXPO_PUBLIC_WEB_APP_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:3000';
  const lcaUrl = `${webBase}/lca`;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'LCA & Verification' }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <View className="flex-row items-center gap-3 p-4 border-b border-slate-100">
          <View className="h-12 w-12 rounded-xl bg-purple-100 items-center justify-center">
            <Calculator color="#8b5cf6" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">Lifecycle Assessment</Text>
            <Text className="text-xs text-slate-500">
              Full verification and calculations via web interface
            </Text>
          </View>
        </View>
        <WebView
          source={{ uri: lcaUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text className="mt-3 text-slate-600 text-sm">Loading LCA tools…</Text>
            </View>
          )}
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </>
  );
}
