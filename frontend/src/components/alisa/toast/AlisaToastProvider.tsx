import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { SnackbarOrigin } from "@mui/material";
import AlisaToast from "./AlisaToast";

export interface ToastOptions {
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  position?: SnackbarOrigin;
  duration?: number | null;
  action?: ReactNode;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface AlisaToastProviderProps {
  children: ReactNode;
}

export function AlisaToastProvider({ children }: AlisaToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...options }]);
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <AlisaToast
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
    throw new Error("useToast must be used within AlisaToastProvider");
  }
  return context;
}
