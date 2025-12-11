import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ArrowLeft, QrCode, Flashlight, FlashlightOff, History } from 'lucide-react-native';
import { useScanStore } from '@/stores/scan';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const { scanHistory, addScan } = useScanStore();

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    // Add to persistent history
    addScan(data, type);

    // Parse the scanned data to determine the entity type
    // Expected format: TYPE:ID or just serial numbers
    const match = data.match(/^(FEEDSTOCK|PRODUCTION|SEQUESTRATION|BCU):(.+)$/i);

    if (match) {
      const [, entityType, id] = match;
      const route = entityType.toLowerCase();

      Alert.alert(
        'QR Code Scanned',
        `Found ${entityType} with ID: ${id}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          {
            text: 'View Details',
            onPress: () => {
              router.push(`/${route}/${id}`);
            }
          },
        ]
      );
    } else {
      // Try to search for the serial number
      Alert.alert(
        'Code Scanned',
        `Scanned: ${data}`,
        [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          {
            text: 'Search',
            onPress: () => {
              // Navigate to search with the scanned data
              Alert.alert('Search', `Would search for: ${data}`);
              setScanned(false);
            }
          },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Scan QR Code',
            headerLeft: () => (
              <Pressable onPress={() => router.back()} className="mr-4">
                <ArrowLeft color="#1e293b" size={24} />
              </Pressable>
            ),
          }}
        />
        <SafeAreaView className="flex-1 bg-slate-900" edges={['bottom']}>
          <View className="flex-1 items-center justify-center p-6">
            <View className="h-24 w-24 rounded-2xl bg-white/10 items-center justify-center mb-6">
              <QrCode color="white" size={48} />
            </View>
            <Text className="text-xl font-bold text-white text-center mb-2">
              Camera Permission Required
            </Text>
            <Text className="text-sm text-slate-400 text-center mb-6">
              Please grant camera access to scan QR codes for feedstock, production batches, and sequestration events.
            </Text>
            <Pressable
              onPress={requestPermission}
              className="bg-blue-500 px-6 py-3 rounded-xl active:opacity-80"
            >
              <Text className="text-white font-medium">Grant Permission</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Scan QR Code',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: 'white',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <ArrowLeft color="white" size={24} />
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row gap-4">
              <Pressable onPress={() => setTorch(!torch)}>
                {torch ? (
                  <Flashlight color="yellow" size={22} />
                ) : (
                  <FlashlightOff color="white" size={22} />
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <View className="flex-1">
          {/* Top overlay */}
          <View className="flex-1 bg-black/60" />

          {/* Middle section with scanning frame */}
          <View className="flex-row">
            <View className="flex-1 bg-black/60" />
            <View className="w-72 h-72 relative">
              {/* Corner indicators */}
              <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
            </View>
            <View className="flex-1 bg-black/60" />
          </View>

          {/* Bottom overlay */}
          <View className="flex-1 bg-black/60 items-center pt-8">
            <Text className="text-white text-sm mb-2">
              Position QR code within the frame
            </Text>
            <Text className="text-slate-400 text-xs">
              Supports: Feedstock, Production, Sequestration, BCU codes
            </Text>

            {/* Recent scans */}
            {scanHistory.length > 0 && (
              <View className="mt-6 w-full px-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <History color="#94a3b8" size={14} />
                  <Text className="text-slate-400 text-xs font-medium">Recent Scans</Text>
                </View>
                <View className="bg-white/10 rounded-lg p-2">
                  {scanHistory.slice(0, 3).map((scan, index) => (
                    <Text key={index} className="text-slate-300 text-xs py-1" numberOfLines={1}>
                      {scan.data}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {scanned && (
              <Pressable
                onPress={() => setScanned(false)}
                className="mt-6 bg-blue-500 px-6 py-3 rounded-xl active:opacity-80"
              >
                <Text className="text-white font-medium">Scan Again</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </>
  );
}
