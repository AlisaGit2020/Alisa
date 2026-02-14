import { useEffect, useState, ReactNode } from "react";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import ApiClient from "@alisa-lib/api-client";
import { setCurrentUserId, getCurrentUserId } from "@alisa-lib/user-storage";

interface AuthInitializerProps {
  children: ReactNode;
}

function AuthInitializer({ children }: AuthInitializerProps) {
  const isAuthenticated = useIsAuthenticated();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeUserId = async () => {
      if (isAuthenticated) {
        const existingUserId = getCurrentUserId();
        if (existingUserId === null) {
          try {
            const user = await ApiClient.me();
            setCurrentUserId(user.id ?? null);
          } catch {
            setCurrentUserId(null);
          }
        }
      } else {
        setCurrentUserId(null);
      }
      setInitialized(true);
    };

    initializeUserId();
  }, [isAuthenticated]);

  if (!initialized) {
    return null;
  }

  return <>{children}</>;
}

export default AuthInitializer;
