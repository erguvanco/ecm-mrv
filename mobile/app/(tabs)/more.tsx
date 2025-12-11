import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Truck,
  Zap,
  Calculator,
  FileCheck,
  Network,
  Database,
  ChevronRight,
  QrCode,
  Settings,
} from 'lucide-react-native';

type ValidHref = 
  | '/transport'
  | '/energy'
  | '/network'
  | '/lca'
  | '/registry'
  | '/datasets';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  href: ValidHref;
}

const menuItems: MenuItem[] = [
  {
    id: 'transport',
    label: 'Logistics (On-Site)',
    description: 'Internal material movements',
    icon: Truck,
    color: '#64748b',
    href: '/transport',
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Energy consumption tracking',
    icon: Zap,
    color: '#f59e0b',
    href: '/energy',
  },
  {
    id: 'network',
    label: 'Network',
    description: 'Supply chain map',
    icon: Network,
    color: '#06b6d4',
    href: '/network',
  },
  {
    id: 'lca',
    label: 'LCA & Verification',
    description: 'Lifecycle assessment',
    icon: Calculator,
    color: '#8b5cf6',
    href: '/lca',
  },
  {
    id: 'registry',
    label: 'Registry',
    description: 'BCU issuance & tracking',
    icon: FileCheck,
    color: '#22c55e',
    href: '/registry',
  },
  {
    id: 'datasets',
    label: 'Datasets',
    description: 'Reference data management',
    icon: Database,
    color: '#3b82f6',
    href: '/datasets',
  },
];

function MenuCard({ item }: { item: MenuItem }) {
  const router = useRouter();
  const Icon = item.icon;

  return (
    <Pressable
      className="flex-row items-center bg-white rounded-xl p-4 border border-slate-200 mb-3 active:bg-slate-50"
      onPress={() => router.push(item.href)}
    >
      <View
        className="h-10 w-10 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: `${item.color}15` }}
      >
        <Icon color={item.color} size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900">{item.label}</Text>
        <Text className="text-xs text-slate-500">{item.description}</Text>
      </View>
      <ChevronRight color="#94a3b8" size={20} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const webBase =
    process.env.EXPO_PUBLIC_WEB_APP_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:3000';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-slate-900">More</Text>
          <Text className="text-sm text-slate-500">Additional modules and settings</Text>
        </View>

        {/* Full Web Experience */}
        <Pressable
          className="flex-row items-center bg-white rounded-xl p-4 border border-slate-200 mb-6 active:bg-slate-50"
          onPress={() => router.push({ pathname: '/web', params: { path: '/' } })}
        >
          <View className="h-10 w-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
            <Text className="text-sm font-semibold text-blue-700">Web</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-900">Open full web app</Text>
            <Text className="text-xs text-slate-500">{webBase}</Text>
          </View>
          <ChevronRight color="#94a3b8" size={20} />
        </Pressable>

        {/* QR Scanner Quick Action */}
        <Pressable
          className="flex-row items-center bg-slate-900 rounded-xl p-4 mb-6 active:bg-slate-800"
          onPress={() => router.push('/scan')}
        >
          <View className="h-12 w-12 rounded-lg bg-white/10 items-center justify-center mr-3">
            <QrCode color="white" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">Scan QR Code</Text>
            <Text className="text-xs text-slate-300">Quickly find batches and events</Text>
          </View>
          <ChevronRight color="white" size={20} />
        </Pressable>

        {/* Menu Items */}
        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Internal Operations
        </Text>
        {menuItems.slice(0, 2).map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}

        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-4">
          Verification
        </Text>
        {menuItems.slice(2, 5).map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}

        <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-4">
          System
        </Text>
        {menuItems.slice(5).map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}

        {/* Settings */}
        <Pressable
          className="flex-row items-center bg-white rounded-xl p-4 border border-slate-200 mt-6 active:bg-slate-50"
          onPress={() => router.push('/settings')}
        >
          <View className="h-10 w-10 rounded-lg bg-slate-100 items-center justify-center mr-3">
            <Settings color="#64748b" size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-900">Settings</Text>
            <Text className="text-xs text-slate-500">App configuration</Text>
          </View>
          <ChevronRight color="#94a3b8" size={20} />
        </Pressable>

        {/* Version */}
        <Text className="text-center text-xs text-slate-400 mt-6">
          ECM MRV v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
