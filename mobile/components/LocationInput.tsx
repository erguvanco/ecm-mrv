import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation, X } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface LocationInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onLocationSelect?: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  error?: string;
  showGpsButton?: boolean;
  containerClassName?: string;
}

interface Suggestion {
  place_name: string;
  center: [number, number];
}

export function LocationInput({
  label,
  value,
  onChangeText,
  onLocationSelect,
  placeholder = 'Enter address...',
  error,
  showGpsButton = true,
  containerClassName,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await api.geocode.search(query);
      setSuggestions(result.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Address search failed:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    searchAddress(text);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    onChangeText(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onLocationSelect) {
      onLocationSelect({
        address: suggestion.place_name,
        lat: suggestion.center[1],
        lng: suggestion.center[0],
      });
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to use this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const [reverseResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseResult) {
        const address = [
          reverseResult.streetNumber,
          reverseResult.street,
          reverseResult.city,
          reverseResult.region,
          reverseResult.postalCode,
          reverseResult.country,
        ]
          .filter(Boolean)
          .join(', ');

        onChangeText(address);

        if (onLocationSelect) {
          onLocationSelect({
            address,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      }
    } catch (err) {
      console.error('Failed to get location:', err);
      alert('Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const clearInput = () => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      )}

      <View className="flex-row items-center gap-2">
        <View className="flex-1 relative">
          <View className="flex-row items-center">
            <MapPin size={16} color="#64748b" className="absolute left-3" />
            <TextInput
              className={cn(
                'flex-1 h-10 pl-9 pr-8 rounded-lg border bg-white text-slate-900',
                error ? 'border-red-500' : 'border-slate-200'
              )}
              value={value}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {value.length > 0 && (
              <TouchableOpacity
                onPress={clearInput}
                className="absolute right-2 p-1"
              >
                <X size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {isSearching && (
            <ActivityIndicator
              size="small"
              color="#64748b"
              className="absolute right-8 top-3"
            />
          )}
        </View>

        {showGpsButton && (
          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white',
              isGettingLocation && 'opacity-50'
            )}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#22c55e" />
            ) : (
              <Navigation size={18} color="#22c55e" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View className="bg-white border border-slate-200 rounded-lg max-h-48 overflow-hidden">
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.place_name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSuggestionSelect(item)}
                className="px-3 py-2 border-b border-slate-100"
              >
                <Text className="text-sm text-slate-700" numberOfLines={2}>
                  {item.place_name}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
