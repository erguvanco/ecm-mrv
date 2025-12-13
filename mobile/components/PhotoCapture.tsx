import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Upload } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  label?: string;
  value?: string; // URI of selected image
  onPhotoSelect: (uri: string | null) => void;
  onUpload?: (uri: string) => Promise<void>;
  placeholder?: string;
  error?: string;
  isUploading?: boolean;
  containerClassName?: string;
}

export function PhotoCapture({
  label,
  value,
  onPhotoSelect,
  onUpload,
  placeholder = 'Add photo',
  error,
  isUploading = false,
  containerClassName,
}: PhotoCaptureProps) {
  const [localLoading, setLocalLoading] = useState(false);

  const requestPermissions = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions('camera');
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    setLocalLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelect(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions('gallery');
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Gallery permission is needed to select photos');
      return;
    }

    setLocalLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelect(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to select photo');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoSelect(null);
  };

  const handleUpload = async () => {
    if (value && onUpload) {
      try {
        await onUpload(value);
      } catch (err) {
        console.error('Upload error:', err);
        Alert.alert('Error', 'Failed to upload photo');
      }
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const isLoading = localLoading || isUploading;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      )}

      {value ? (
        <View className="relative">
          <Image
            source={{ uri: value }}
            className="w-full h-48 rounded-lg"
            resizeMode="cover"
          />

          <View className="absolute top-2 right-2 flex-row gap-2">
            {onUpload && (
              <TouchableOpacity
                onPress={handleUpload}
                disabled={isLoading}
                className="h-8 w-8 items-center justify-center rounded-full bg-green-500"
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Upload size={16} color="#fff" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleRemovePhoto}
              disabled={isLoading}
              className="h-8 w-8 items-center justify-center rounded-full bg-red-500"
            >
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={showOptions}
          disabled={isLoading}
          className={cn(
            'h-32 items-center justify-center rounded-lg border-2 border-dashed bg-slate-50',
            error ? 'border-red-300' : 'border-slate-200',
            isLoading && 'opacity-50'
          )}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#64748b" />
          ) : (
            <View className="items-center gap-2">
              <View className="flex-row gap-4">
                <View className="items-center">
                  <Camera size={24} color="#64748b" />
                  <Text className="text-xs text-slate-500 mt-1">Camera</Text>
                </View>
                <View className="items-center">
                  <ImageIcon size={24} color="#64748b" />
                  <Text className="text-xs text-slate-500 mt-1">Gallery</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-500">{placeholder}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
