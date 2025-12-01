import { useToastContext } from '../components/ui/toast/ToastProvider';

export const useToast = () => {
  const ctx = useToastContext();
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
