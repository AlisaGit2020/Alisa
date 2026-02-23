import useSignOut from "react-auth-kit/hooks/useSignOut";
import { setCurrentUserId } from "@asset-lib/user-storage";

export function useSignOutWithCleanup() {
  const signOut = useSignOut();

  return () => {
    setCurrentUserId(null);
    signOut();
    window.location.href = "/";
  };
}
