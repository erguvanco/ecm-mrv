import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Leaf, Factory, ArrowDownToLine, Zap, Truck } from 'lucide-react-native';

interface EntryCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  bgColor: string;
  route: string;
}

function EntryCard({ title, subtitle, icon: Icon, color, bgColor, route }: EntryCardProps) {
  const router = useRouter();

  return (
    <Pressable
      className="flex-1 bg-white rounded-xl p-4 border border-slate-200 active:opacity-80"
      onPress={() => router.push(route as never)}
    >
      <View
        className="h-12 w-12 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Icon color={color} size={24} />
      </View>
      <Text className="text-base font-semibold text-slate-900">{title}</Text>
      <Text className="text-xs text-slate-500 mt-1">{subtitle}</Text>
    </Pressable>
  );
}

export default function EntryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900">Data Entry</Text>
          <Text className="text-sm text-slate-500 mt-1">Record field operations</Text>
        </View>

        {/* Main entry options */}
        <Text className="text-sm font-semibold text-slate-700 mb-3">Core Operations</Text>
        <View className="flex-row gap-3 mb-4">
          <EntryCard
            title="Feedstock"
            subtitle="Log delivery"
            icon={Leaf}
            color="#22c55e"
            bgColor="#dcfce7"
            route="/feedstock/new"
          />
          <EntryCard
            title="Production"
            subtitle="Record batch"
            icon={Factory}
            color="#3b82f6"
            bgColor="#dbeafe"
            route="/production/new"
          />
        </View>

        <View className="flex-row gap-3 mb-6">
          <EntryCard
            title="Sequestration"
            subtitle="Track carbon"
            icon={ArrowDownToLine}
            color="#8b5cf6"
            bgColor="#ede9fe"
            route="/sequestration/new"
          />
          <View className="flex-1" />
        </View>

        {/* Supporting entries */}
        <Text className="text-sm font-semibold text-slate-700 mb-3">Supporting Data</Text>
        <View className="flex-row gap-3">
          <EntryCard
            title="Energy"
            subtitle="Log usage"
            icon={Zap}
            color="#f59e0b"
            bgColor="#fef3c7"
            route="/energy/new"
          />
          <EntryCard
            title="Transport"
            subtitle="Log movement"
            icon={Truck}
            color="#64748b"
            bgColor="#f1f5f9"
            route="/transport/new"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
