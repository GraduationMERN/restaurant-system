import { useToastContext } from '../components/ui/toast/ToastProvider';

export const useToast = () => {
  const ctx = useToastContext();
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  
  // Create helper methods for different toast types
  return {
    ...ctx,
    success: (message, duration = 3000) => ctx.showToast({ message, type: 'success', duration }),
    error: (message, duration = 3000) => ctx.showToast({ message, type: 'error', duration }),
    info: (message, duration = 3000) => ctx.showToast({ message, type: 'info', duration }),
    warning: (message, duration = 3000) => ctx.showToast({ message, type: 'warning', duration }),
  };
};
