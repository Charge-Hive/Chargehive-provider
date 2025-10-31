import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔑 API Request:', config.method.toUpperCase(), config.url);
    console.log('🔑 Token present:', token ? 'YES' : 'NO');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set');
    } else {
      console.warn('⚠️  No auth token found in AsyncStorage!');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detailed error information
    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('providerData');
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (email, password, businessName, phone) => {
    const response = await api.post(ENDPOINTS.PROVIDER_REGISTER, {
      email,
      password,
      name: businessName,
      phone,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post(ENDPOINTS.PROVIDER_LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get(ENDPOINTS.PROVIDER_PROFILE);
    return response.data;
  },
};

// Service API calls
export const serviceAPI = {
  getAllServices: async () => {
    try {
      const response = await api.get(ENDPOINTS.SERVICES_LIST);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      return { success: true, data: [] };
    }
  },

  getProviderServices: async () => {
    try {
      const response = await api.get(ENDPOINTS.PROVIDER_SERVICES);
      return response.data;
    } catch (error) {
      return { success: true, data: [] };
    }
  },

  addService: async (serviceData) => {
    const response = await api.post(ENDPOINTS.PROVIDER_ADD_SERVICE, serviceData);
    return response.data;
  },
};

// Wallet API calls
export const walletAPI = {
  getWalletDetails: async () => {
    const response = await api.get(ENDPOINTS.WALLET_DETAILS);
    return response.data;
  },

  getWalletTransactions: async (limit = 10) => {
    const response = await api.get(`${ENDPOINTS.WALLET_TRANSACTIONS}?limit=${limit}`);
    return response.data;
  },

  getCHTBalance: async () => {
    const response = await api.get(ENDPOINTS.WALLET_CHT_BALANCE);
    return response.data;
  },
};

export default api;
