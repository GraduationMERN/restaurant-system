import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from './useToast';

/**
 * Hook to fetch enabled payment methods from the backend
 * Returns only enabled payment methods that should be displayed to users
 */
export function usePaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/payment-methods');
      
      // Filter to only enabled methods
      const enabledMethods = (response.data.data || []).filter(method => method.enabled);
      setMethods(enabledMethods);
      
      console.log('Loaded payment methods:', enabledMethods);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load payment methods';
      setError(message);
      console.error('Error loading payment methods:', err);
      // Don't show toast for this as it might not be critical
    } finally {
      setLoading(false);
    }
  };

  return { methods, loading, error, reload: loadPaymentMethods };
}
