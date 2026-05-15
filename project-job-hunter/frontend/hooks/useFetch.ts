// Custom hook para manejar fetch de datos
import { ApiError, LoadingState } from '@/types/index';
import { useCallback, useEffect, useState } from 'react';

interface UseFetchOptions {
  skip?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseFetchState<T> extends LoadingState {
  data: T | null;
}

export const useFetch = <T,>(
  fetchFn: () => Promise<T>,
  options?: UseFetchOptions
): UseFetchState<T> & { refetch: () => Promise<void> } => {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isError: false,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null, isError: false }));
    try {
      const result = await fetchFn();
      setState({
        data: result,
        isLoading: false,
        error: null,
        isError: false,
      });
      options?.onSuccess?.(result);
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred';
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        isError: true,
      });
      options?.onError?.(error);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!options?.skip) {
      fetch();
    }
  }, [fetch, options?.skip]);

  return {
    ...state,
    refetch: fetch,
  };
};

export default useFetch;