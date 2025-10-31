import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const providerData = await AsyncStorage.getItem('providerData');

      if (token && providerData) {
        setIsAuthenticated(true);
        setProvider(JSON.parse(providerData));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success && response.data) {
        // Backend returns access_token, not token
        await AsyncStorage.setItem('authToken', response.data.access_token);
        await AsyncStorage.setItem('providerData', JSON.stringify(response.data.provider));

        setIsAuthenticated(true);
        setProvider(response.data.provider);

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (email, password, businessName, phone) => {
    try {
      const response = await authAPI.register(email, password, businessName, phone);

      if (response.success && response.data) {
        // Backend returns access_token, not token
        await AsyncStorage.setItem('authToken', response.data.access_token);
        await AsyncStorage.setItem('providerData', JSON.stringify(response.data.provider));

        setIsAuthenticated(true);
        setProvider(response.data.provider);

        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('providerData');
      setIsAuthenticated(false);
      setProvider(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        provider,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
