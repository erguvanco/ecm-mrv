import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import WebView from 'react-native-webview';
import { Network } from 'lucide-react-native';

export default function NetworkScreen() {
  const webBase =
    process.env.EXPO_PUBLIC_WEB_APP_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:3000';
  const networkUrl = `${webBase}/network`;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Network Map' }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <View className="flex-row items-center gap-3 p-4 border-b border-slate-100">
          <View className="h-12 w-12 rounded-xl bg-cyan-100 items-center justify-center">
            <Network color="#06b6d4" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">Supply Chain Map</Text>
            <Text className="text-xs text-slate-500">
              Full web map with routing and locations
            </Text>
          </View>
        </View>
        <WebView
          source={{ uri: networkUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text className="mt-3 text-slate-600 text-sm">Loading network map…</Text>
            </View>
          )}
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </>
  );
}
