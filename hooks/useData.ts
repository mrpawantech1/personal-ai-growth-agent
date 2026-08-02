'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/infrastructure/supabase/client';

interface UseDataOptions<T> {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

interface UseDataState<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
}

export function useData<T = any>(options: UseDataOptions<T>) {
  const {
    table,
    select = '*',
    filters = {},
    orderBy,
    limit,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseDataState<T>>({
    data: [],
    isLoading: true,
    error: null,
    isRefreshing: false,
  });

  const supabase = createClient();
  const isMounted = useRef(true);
  const fetchId = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const currentFetchId = ++fetchId.current;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let query = supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      // Check if this fetch is still valid
      if (currentFetchId !== fetchId.current) return;

      if (error) throw error;

      const typedData = data as T[];

      if (isMounted.current) {
        setState({
          data: typedData,
          isLoading: false,
          error: null,
          isRefreshing: false,
        });
        onSuccess?.(typedData);
      }
    } catch (error) {
      if (currentFetchId !== fetchId.current) return;

      const err = error instanceof Error ? error : new Error('Unknown error');
      if (isMounted.current) {
        setState({
          data: [],
          isLoading: false,
          error: err,
          isRefreshing: false,
        });
        onError?.(err);
      }
    }
  }, [table, select, filters, orderBy, limit, enabled, onSuccess, onError, supabase]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    fetchData();
  }, [fetchData]);

  const mutate = useCallback((updater: (oldData: T[]) => T[]) => {
    setState(prev => ({
      ...prev,
      data: updater(prev.data),
    }));
  }, []);

  useEffect(() => {
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  return {
    ...state,
    refresh,
    mutate,
  };
}

// Specialized hook for single item
export function useDataItem<T = any>(options: Omit<UseDataOptions<T>, 'limit'> & { id: string | number }) {
  const { id, ...rest } = options;
  const result = useData<T>({
    ...rest,
    filters: { ...rest.filters, id },
    limit: 1,
  });

  return {
    ...result,
    item: result.data[0] || null,
  };
}
