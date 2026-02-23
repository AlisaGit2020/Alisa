import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { SnackbarOrigin } from "@mui/material";
import AssetToast from "./AssetToast";

export interface ToastOptions {
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  position?: SnackbarOrigin;
  duration?: number | null;
  action?: ReactNode;
}

interface Toast extends ToastOptions {
  id: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface AssetToastProviderProps {
  children: ReactNode;
}

export function AssetToastProvider({ children }: AssetToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <AssetToast
          key={toast.id}
          open={true}
          onClose={() => hideToast(toast.id)}
          message={toast.message}
          severity={toast.severity}
          position={toast.position}
          duration={toast.duration}
          action={toast.action}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within AssetToastProvider");
  }
  return context;
}

// Alias for consistency with Asset* naming convention
export const useAssetToast = useToast;
