import { useState, useCallback } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../hooks/useToast';

export function useSettingsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // System Settings
  const getSystemSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/system-settings');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load system settings';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateSystemSettings = useCallback(async (settings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/restaurant/system-settings', {
        systemSettings: settings,
      });
      showToast('System settings updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update system settings';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateSystemCategory = useCallback(async (category, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/system-settings/${category}`,
        data
      );
      showToast(`${category} settings updated successfully`, 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update settings';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Service Settings
  const getServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/services');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load services';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateServices = useCallback(async (services) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/restaurant/services', services);
      showToast('Services updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update services';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const toggleService = useCallback(async (service, enabled) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/services/${service}/toggle`,
        { enabled }
      );
      showToast(`Service ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to toggle service';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Payment Methods
  const getPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/payment-methods');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load payment methods';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const addPaymentMethod = useCallback(async (method) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/restaurant/payment-methods', method);
      showToast('Payment method added successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add payment method';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updatePaymentMethod = useCallback(async (methodId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/payment-methods/${methodId}`,
        updates
      );
      showToast('Payment method updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update payment method';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const removePaymentMethod = useCallback(async (methodId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.delete(
        `/api/restaurant/payment-methods/${methodId}`
      );
      showToast('Payment method removed successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove payment method';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const togglePaymentMethod = useCallback(async (methodId, enabled) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/payment-methods/${methodId}/toggle`,
        { enabled }
      );
      showToast(`Payment method ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to toggle payment method';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Website Design
  const getWebsiteDesign = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/website-design');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load website design';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateWebsiteDesign = useCallback(async (design) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/restaurant/website-design', design);
      showToast('Website design updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update website design';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateWebsiteColors = useCallback(async (colors) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/restaurant/website-design/colors', {
        colors,
      });
      showToast('Colors updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update colors';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Integrations
  const getIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/integrations');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load integrations';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateIntegration = useCallback(async (integration, settings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/integrations/${integration}`,
        settings
      );
      showToast(`${integration} updated successfully`, 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update integration';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const toggleIntegration = useCallback(async (integration, enabled) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(
        `/api/restaurant/integrations/${integration}/toggle`,
        { enabled }
      );
      showToast(`Integration ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to toggle integration';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Content (FAQs & Policies)
  const getFAQs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/faqs');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load FAQs';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const addFAQ = useCallback(async (faq) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/restaurant/faqs', faq);
      showToast('FAQ added successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add FAQ';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateFAQ = useCallback(async (faqId, faq) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/api/restaurant/faqs/${faqId}`, faq);
      showToast('FAQ updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update FAQ';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const removeFAQ = useCallback(async (faqId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.delete(`/api/restaurant/faqs/${faqId}`);
      showToast('FAQ removed successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove FAQ';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/policies');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load policies';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updatePolicies = useCallback(async (policies) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/api/restaurant/policies', policies);
      showToast('Policies updated successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update policies';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // File Uploads
  const uploadLogo = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('logo', file);
      const response = await api.post('/api/restaurant/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Logo uploaded successfully', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload logo';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Bulk export/import
  const exportSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/restaurant/export-settings');
      showToast('Settings exported', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to export settings';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const importSettings = useCallback(async (settings, options = { overwrite: false }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/restaurant/import-settings', { settings, options });
      showToast('Settings imported', 'success');
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to import settings';
      setError(message);
      showToast(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    error,
    // System
    getSystemSettings,
    updateSystemSettings,
    updateSystemCategory,
    // Services
    getServices,
    updateServices,
    toggleService,
    // Payments
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    togglePaymentMethod,
    // Website Design
    getWebsiteDesign,
    updateWebsiteDesign,
    updateWebsiteColors,
    // Integrations
    getIntegrations,
    updateIntegration,
    toggleIntegration,
    // Content
    getFAQs,
    addFAQ,
    updateFAQ,
    removeFAQ,
    getPolicies,
    updatePolicies,
    // File Uploads
    uploadLogo,
    // Bulk
    exportSettings,
    importSettings,
  };
}
