import db from '@/lib/db';

export interface GeocodingResult {
  success: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  cached?: boolean;
  error?: string;
}

export interface GeocodeSuggestion {
  id: string;
  placeName: string;
  coordinates: [number, number]; // [lng, lat]
}

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const CACHE_TTL_DAYS = 90;

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim().length < 2) {
    return { success: false, error: 'Address too short' };
  }

  const normalizedQuery = normalizeQuery(address);

  // Check cache first
  const cached = await db.geocodeCache.findFirst({
    where: {
      queryString: normalizedQuery,
      expiresAt: { gt: new Date() },
    },
  });

  if (cached) {
    return {
      success: true,
      lat: cached.lat,
      lng: cached.lng,
      formattedAddress: cached.formattedAddress || undefined,
      cached: true,
    };
  }

  // Call Mapbox Geocoding API
  if (!MAPBOX_ACCESS_TOKEN) {
    return { success: false, error: 'Mapbox API token not configured' };
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `Geocoding API error: ${response.status}` };
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return { success: false, error: 'No results found for this address' };
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;
    const formattedAddress = feature.place_name;

    // Cache the result
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

    await db.geocodeCache.upsert({
      where: { queryString: normalizedQuery },
      create: {
        queryString: normalizedQuery,
        lat,
        lng,
        formattedAddress,
        expiresAt,
      },
      update: {
        lat,
        lng,
        formattedAddress,
        expiresAt,
      },
    });

    return {
      success: true,
      lat,
      lng,
      formattedAddress,
      cached: false,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { success: false, error: 'Failed to geocode address' };
  }
}

export async function searchAddresses(query: string): Promise<GeocodeSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (!MAPBOX_ACCESS_TOKEN) {
    return [];
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5&types=address,postcode,place`;

    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.features) {
      return [];
    }

    return data.features.map((feature: { id: string; place_name: string; center: [number, number] }) => ({
      id: feature.id,
      placeName: feature.place_name,
      coordinates: feature.center as [number, number],
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}
