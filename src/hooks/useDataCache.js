import { useState, useEffect, useRef, useCallback } from "react";

// Simple in-memory cache with TTL
class DataCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp, ttl } = cached;
    if (Date.now() - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  invalidate(pattern) {
    if (typeof pattern === "string") {
      this.cache.delete(pattern);
    } else if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

const globalCache = new DataCache();

export const useDataCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchWithCache = useCallback(
    async (key, fetchFunction, options = {}) => {
      const {
        useCache = true,
        ttl = 5 * 60 * 1000, // 5 minutes default
        onSuccess,
        onError,
      } = options;

      // Check cache first
      if (useCache) {
        const cached = globalCache.get(key);
        if (cached) {
          onSuccess?.(cached);
          return cached;
        }
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const result = await fetchFunction(abortControllerRef.current.signal);

        // Cache the result
        if (useCache && result) {
          globalCache.set(key, result, ttl);
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(`Error fetching ${key}:`, err);
          setError(err);
          onError?.(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const invalidateCache = useCallback((pattern) => {
    globalCache.invalidate(pattern);
  }, []);

  const clearCache = useCallback(() => {
    globalCache.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    fetchWithCache,
    invalidateCache,
    clearCache,
    loading,
    error,
  };
};
