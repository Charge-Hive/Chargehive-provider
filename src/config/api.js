// API Configuration
export const API_CONFIG = {
  // Use your Mac's IP address for local development
  // Note: Update this IP if your network changes
  BASE_URL: 'http://10.0.0.196:3000/api',

  // For production, use:
  // BASE_URL: 'https://chargehive-backend-dev-c567e0fd7ba7.herokuapp.com/api',

  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const ENDPOINTS = {
  // Provider endpoints
  PROVIDER_REGISTER: '/provider/signup',
  PROVIDER_LOGIN: '/provider/login',
  PROVIDER_PROFILE: '/provider/profile',
  PROVIDER_ADD_SERVICE: '/provider/services',

  // Service endpoints
  SERVICES_LIST: '/services',
  PROVIDER_SERVICES: '/provider/services',

  // Wallet endpoints
  WALLET_DETAILS: '/wallet',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  WALLET_CHT_BALANCE: '/wallet/cht-balance',
};
