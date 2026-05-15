// Custom hook for handling authentication via Zustand
import { useAuthStore } from '@store/authStore';

export const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading, 
    error,
    login,
    signup,
    logout,
    updateUser,
    restoreAuth
  } = useAuthStore();

  return {
    state: {
      user,
      token,
      isAuthenticated,
      isLoading,
      error
    },
    login,
    signup,
    logout,
    updateUser,
    isLoading,
    restoreAuth
  };
};

export default useAuth;