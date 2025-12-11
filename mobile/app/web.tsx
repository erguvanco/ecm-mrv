import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import WebView from 'react-native-webview';

const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_APP_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

function buildUrl(path?: string | string[]) {
  if (!path) return WEB_BASE;
  const normalized = Array.isArray(path) ? path[0] : path;
  if (!normalized) return WEB_BASE;
  return `${WEB_BASE}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

export default function WebPortalScreen() {
  const { path } = useLocalSearchParams<{ path?: string | string[] }>();
  const targetUrl = buildUrl(path);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Web Experience',
        }}
      />
      <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
        <WebView
          source={{ uri: targetUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#22c55e" />
              <Text className="mt-3 text-slate-600 text-sm">Loading web app…</Text>
            </View>
          )}
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </>
  );
}
