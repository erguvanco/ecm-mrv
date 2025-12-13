const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

// Paginated response structure from web API
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Helper to extract data from paginated or array response
function extractData<T>(response: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || [];
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = REQUEST_TIMEOUT } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  config.signal = controller.signal;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message === 'Network request failed' || error.message.includes('network')) {
        throw new NetworkError('Unable to connect to the server. Please check your internet connection.');
      }
    }
    
    throw new NetworkError('An unexpected network error occurred. Please try again.');
  }
}

export const api = {
  // Dashboard
  dashboard: {
    getStats: () =>
      request<{
        feedstockCount: number;
        productionCount: number;
        sequestrationCount: number;
        totalBiocharTonnes: number;
        totalCO2eTonnes: number;
        // CORC metrics
        totalCORCsIssued: number;
        corcsDraft: number;
        corcsIssued: number;
        corcsRetired: number;
        pendingVerification: number;
        activeMonitoringPeriod: {
          id: string;
          periodStart: string;
          periodEnd: string;
          status: string;
        } | null;
      }>('/api/dashboard/stats'),
  },

  // Facility
  facility: {
    get: () =>
      request<{
        id: string;
        name: string;
        registrationNumber: string;
        baselineType: string;
        address: string | null;
        country: string | null;
        creditingPeriodStart: string;
        creditingPeriodEnd: string;
      } | null>('/api/facility'),
  },

  // Monitoring Periods
  monitoring: {
    list: () =>
      request<
        Array<{
          id: string;
          periodStart: string;
          periodEnd: string;
          status: string;
          netCORCsTCO2e: number | null;
        }>
      >('/api/monitoring-period'),
    get: (id: string) => request(`/api/monitoring-period/${id}`),
  },

  // CORC Registry
  corc: {
    list: () =>
      request<
        Array<{
          id: string;
          serialNumber: string;
          status: string;
          netCORCsTCO2e: number;
          permanenceType: string;
          createdAt: string;
          monitoringPeriod: {
            periodStart: string;
            periodEnd: string;
            facility: { name: string };
          };
        }>
      >('/api/corc'),
    get: (id: string) =>
      request<{
        id: string;
        serialNumber: string;
        status: string;
        netCORCsTCO2e: number;
        cStoredTCO2e: number;
        cBaselineTCO2e: number;
        cLossTCO2e: number;
        persistenceFractionPercent: number;
        eProjectTCO2e: number;
        eLeakageTCO2e: number;
        permanenceType: string;
        issuanceDate: string | null;
        retirementDate: string | null;
        retirementBeneficiary: string | null;
        notes: string | null;
      }>(`/api/corc/${id}`),
  },

  // Feedstock
  feedstock: {
    list: () =>
      request<
        PaginatedResponse<{
          id: string;
          serialNumber: string | null;
          date: string;
          feedstockType: string;
          weightTonnes: number;
          sourceAddress: string | null;
          vehicleId: string | null;
          truckPhotoUrl: string | null;
          evidence?: { id: string }[];
        }>
      >('/api/feedstock').then(extractData),
    get: (id: string) => request(`/api/feedstock/${id}`),
    create: (data: unknown) =>
      request('/api/feedstock', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/feedstock/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/feedstock/${id}`, { method: 'DELETE' }),
    uploadTruckPhoto: async (id: string, uri: string) => {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: `truck-photo-${Date.now()}.jpg`,
      } as unknown as Blob);

      const response = await fetch(`${API_BASE}/api/feedstock/${id}/truck-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new ApiError('Failed to upload photo', response.status);
      }

      return response.json();
    },
  },

  // Production
  production: {
    list: () =>
      request<
        PaginatedResponse<{
          id: string;
          serialNumber: string | null;
          productionDate: string;
          status: string;
          inputFeedstockWeightTonnes: number;
          outputBiocharWeightTonnes: number;
          temperatureMin: number | null;
          temperatureMax: number | null;
          temperatureAvg: number | null;
          feedstockAllocations?: Array<{
            feedstockDelivery: { feedstockType: string };
            percentageUsed: number;
          }>;
        }>
      >('/api/production').then(extractData),
    get: (id: string) => request(`/api/production/${id}`),
    create: (data: unknown) =>
      request('/api/production', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/production/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/production/${id}`, { method: 'DELETE' }),
  },

  // Sequestration
  sequestration: {
    list: () =>
      request<
        PaginatedResponse<{
          id: string;
          serialNumber: string | null;
          finalDeliveryDate: string;
          sequestrationType: string | null;
          deliveryPostcode: string | null;
          storageLocation: string | null;
          storageConditions: string | null;
          batches?: Array<{
            productionBatch: { serialNumber: string | null };
            quantityTonnes: number;
          }>;
        }>
      >('/api/sequestration').then(extractData),
    get: (id: string) => request(`/api/sequestration/${id}`),
    create: (data: unknown) =>
      request('/api/sequestration', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/sequestration/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/sequestration/${id}`, { method: 'DELETE' }),
  },

  // Transport
  transport: {
    list: () =>
      request<
        PaginatedResponse<{
          id: string;
          date: string;
          vehicleId: string | null;
          vehicleType: string | null;
          originAddress: string | null;
          destinationAddress: string | null;
          distanceKm: number;
          fuelType: string | null;
          fuelAmount: number | null;
          fuelUnit: string | null;
        }>
      >('/api/transport').then(extractData),
    get: (id: string) => request<unknown>(`/api/transport/${id}`),
    create: (data: unknown) =>
      request('/api/transport', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/transport/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/transport/${id}`, { method: 'DELETE' }),
  },

  // Energy
  energy: {
    list: () =>
      request<
        PaginatedResponse<{
          id: string;
          periodStart: string;
          periodEnd: string | null;
          energyType: string;
          quantity: number;
          unit: string;
          scope: string;
        }>
      >('/api/energy').then(extractData),
    get: (id: string) => request<unknown>(`/api/energy/${id}`),
    create: (data: unknown) =>
      request('/api/energy', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/energy/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/energy/${id}`, { method: 'DELETE' }),
  },

  // Geocoding
  geocode: {
    search: (query: string) =>
      request<{
        suggestions: Array<{
          place_name: string;
          center: [number, number]; // [lng, lat]
        }>;
      }>(`/api/geocode?q=${encodeURIComponent(query)}&mode=search`),
    getCoords: (address: string) =>
      request<{
        lat: number;
        lng: number;
        formattedAddress: string;
      } | null>(`/api/geocode?q=${encodeURIComponent(address)}&mode=geocode`),
  },
};

export default api;
