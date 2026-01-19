import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from './useToast';

/**
 * Hook to fetch and manage enabled services from the backend
 * This ensures CheckoutPage reflects real-time service settings from admin panel
 */
export function useServices() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Normalize service data - handles both backend format (pickups, deliveries, dineIns)
  // and frontend format (pickup, delivery, dineIn)
  const normalizeServices = useCallback((data) => {
    const normalized = {};
    
    // Check for both possible formats
    if (data.pickup !== undefined) normalized.pickup = data.pickup;
    else if (data.pickups !== undefined) normalized.pickup = data.pickups;
    
    if (data.delivery !== undefined) normalized.delivery = data.delivery;
    else if (data.deliveries !== undefined) normalized.delivery = data.deliveries;
    
    if (data.dineIn !== undefined) normalized.dineIn = data.dineIn;
    else if (data.dineIns !== undefined) normalized.dineIn = data.dineIns;
    
    if (data.tableBookings !== undefined) normalized.tableBookings = data.tableBookings;
    
    return normalized;
  }, []);

  // Fetch services from backend
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/services');
      const serviceData = response.data.data || {};
      
      console.log('=== CHECKOUT useServices FETCH ===');
      console.log('Raw response data:', JSON.stringify(serviceData, null, 2));
      
      // Normalize the service data - handle both old backend format and new frontend format
      const normalizedData = normalizeServices(serviceData);
      console.log('Normalized services:', JSON.stringify(normalizedData, null, 2));
      
      setServices(normalizedData);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load services';
      setError(message);
      console.error('Failed to fetch services:', err);
      // Don't show toast on initial load to avoid user distraction
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Get list of enabled service types
  const getEnabledServiceTypes = useCallback(() => {
    if (!services) return [];

    const enabledTypes = [];
    
    if (services.pickup?.enabled) enabledTypes.push('pickup');
    if (services.delivery?.enabled) enabledTypes.push('delivery');
    if (services.dineIn?.enabled) enabledTypes.push('dine-in');

    return enabledTypes;
  }, [services]);

  // Check if a specific service is enabled
  const isServiceEnabled = useCallback((serviceType) => {
    if (!services) return false;

    switch (serviceType) {
      case 'pickup':
        return services.pickup?.enabled ?? false;
      case 'delivery':
        return services.delivery?.enabled ?? false;
      case 'dine-in':
        return services.dineIn?.enabled ?? false;
      default:
        return false;
    }
  }, [services]);

  // Get service config (e.g., delivery fee, time estimates)
  const getServiceConfig = useCallback((serviceType) => {
    if (!services) return null;

    switch (serviceType) {
      case 'pickup':
        return services.pickup ?? null;
      case 'delivery':
        return services.delivery ?? null;
      case 'dine-in':
        return services.dineIn ?? null;
      default:
        return null;
    }
  }, [services]);

  return {
    services,
    loading,
    error,
    fetchServices,
    getEnabledServiceTypes,
    isServiceEnabled,
    getServiceConfig,
  };
}
