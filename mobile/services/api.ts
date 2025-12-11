const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT = 30000; // 30 seconds

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
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
      }>('/api/dashboard/stats'),
  },

  // Feedstock
  feedstock: {
    list: () =>
      request<
        Array<{
          id: string;
          serialNumber: string | null;
          date: string;
          feedstockType: string;
          weightTonnes: number;
          evidence?: { id: string }[];
        }>
      >('/api/feedstock'),
    get: (id: string) => request(`/api/feedstock/${id}`),
    create: (data: unknown) =>
      request('/api/feedstock', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/feedstock/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/feedstock/${id}`, { method: 'DELETE' }),
  },

  // Production
  production: {
    list: () =>
      request<
        Array<{
          id: string;
          serialNumber: string | null;
          productionDate: string;
          status: string;
          inputFeedstockWeightTonnes: number;
          outputBiocharWeightTonnes: number;
          feedstockDelivery?: { feedstockType: string } | null;
        }>
      >('/api/production'),
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
        Array<{
          id: string;
          serialNumber: string | null;
          finalDeliveryDate: string;
          totalBiocharWeightTonnes: number;
          estimatedCO2eTonnes: number | null;
          applicationMethod: string | null;
          siteDescription: string | null;
        }>
      >('/api/sequestration'),
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
        Array<{
          id: string;
          date: string;
          vehicleId: string | null;
          distanceKm: number;
          fuelType: string | null;
          fuelAmount: number | null;
        }>
      >('/api/transport'),
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
        Array<{
          id: string;
          periodStart: string;
          energyType: string;
          quantity: number;
          unit: string;
          scope: string;
        }>
      >('/api/energy'),
    get: (id: string) => request<unknown>(`/api/energy/${id}`),
    create: (data: unknown) =>
      request('/api/energy', { method: 'POST', body: data }),
    update: (id: string, data: unknown) =>
      request(`/api/energy/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      request(`/api/energy/${id}`, { method: 'DELETE' }),
  },

  // Registry / BCU
  registry: {
    listBCUs: () =>
      request<
        Array<{
          id: string;
          serialNumber: string;
          status: string;
          vintageYear: number;
          quantityTonnesCO2e: number;
        }>
      >('/api/registry/bcu'),
    getBCU: (id: string) => request<unknown>(`/api/registry/bcu/${id}`),
    issueBCU: (data: unknown) =>
      request('/api/registry/bcu', { method: 'POST', body: data }),
  },
};

export default api;
