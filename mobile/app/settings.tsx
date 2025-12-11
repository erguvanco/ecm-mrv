import { View, Text, ScrollView, Pressable, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Server, Bell, Moon, Info, ExternalLink } from 'lucide-react-native';
import { Card, CardContent } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings';

export default function SettingsScreen() {
  const router = useRouter();
  const { notifications, darkMode, setNotifications, setDarkMode } = useSettingsStore();

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="#1e293b" size={24} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* API Configuration */}
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Connection
          </Text>
          <Card className="mb-6">
            <CardContent className="p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-lg bg-blue-100 items-center justify-center">
                  <Server color="#3b82f6" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900">API Server</Text>
                  <Text className="text-xs text-slate-500 font-mono">{apiUrl}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Preferences
          </Text>
          <Card className="mb-6">
            <CardContent className="p-0">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
                <View className="flex-row items-center gap-3">
                  <Bell color="#64748b" size={20} />
                  <Text className="text-sm font-medium text-slate-900">Notifications</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#e2e8f0', true: '#22c55e' }}
                />
              </View>
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center gap-3">
                  <Moon color="#64748b" size={20} />
                  <Text className="text-sm font-medium text-slate-900">Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#e2e8f0', true: '#22c55e' }}
                  disabled
                />
              </View>
            </CardContent>
          </Card>

          {/* About */}
          <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            About
          </Text>
          <Card>
            <CardContent className="p-0">
              <Pressable
                onPress={() => Linking.openURL('https://github.com')}
                className="flex-row items-center justify-between p-4 border-b border-slate-100"
              >
                <View className="flex-row items-center gap-3">
                  <Info color="#64748b" size={20} />
                  <Text className="text-sm font-medium text-slate-900">Documentation</Text>
                </View>
                <ExternalLink color="#94a3b8" size={16} />
              </Pressable>
              <View className="p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-lg bg-slate-100 items-center justify-center">
                    <Text className="text-sm font-bold text-slate-700">E</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-slate-900">ECM MRV</Text>
                    <Text className="text-xs text-slate-500">Version 1.0.0</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
