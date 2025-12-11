import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import WebView from 'react-native-webview';
import { Database } from 'lucide-react-native';

export default function DatasetsScreen() {
  const webBase =
    process.env.EXPO_PUBLIC_WEB_APP_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:3000';
  const datasetsUrl = `${webBase}/datasets`;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Datasets' }} />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <View className="flex-row items-center gap-3 p-4 border-b border-slate-100">
          <View className="h-12 w-12 rounded-xl bg-blue-100 items-center justify-center">
            <Database color="#3b82f6" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">Reference Data</Text>
            <Text className="text-xs text-slate-500">
              Full dataset management from the web experience
            </Text>
          </View>
        </View>
        <WebView
          source={{ uri: datasetsUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-3 text-slate-600 text-sm">Loading datasets…</Text>
            </View>
          )}
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </>
  );
}
