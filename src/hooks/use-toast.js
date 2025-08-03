import { toast } from 'sonner';

export const useToast = () => {
  const showToast = (options) => {
    const { title, description, variant = 'default', duration = 5000 } = options;
    
    const message = description ? `${title}\n${description}` : title;
    
    switch (variant) {
      case 'destructive':
        return toast.error(message, { duration });
      case 'success':
        return toast.success(message, { duration });
      case 'warning':
        return toast.warning(message, { duration });
      default:
        return toast(message, { duration });
    }
  };

  return {
    toast: showToast,
    success: (message, options = {}) => toast.success(message, options),
    error: (message, options = {}) => toast.error(message, options),
    warning: (message, options = {}) => toast.warning(message, options),
    info: (message, options = {}) => toast.info(message, options),
    dismiss: (toastId) => toast.dismiss(toastId),
    dismissAll: () => toast.dismiss(),
  };
}; 