/**
 * Request Debouncer
 * Eliminates excessive API calls by implementing intelligent request batching and caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class RequestDebouncer {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly CACHE_DURATION = 240000; // 4 minutes to match calculation cycle
  private readonly DEBOUNCE_DELAY = 1000; // 1 second debounce
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Debounced fetch with intelligent caching
   */
  async debouncedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    customCacheDuration?: number
  ): Promise<T> {
    const cacheDuration = customCacheDuration || this.CACHE_DURATION;
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < cacheDuration) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Clear existing timeout
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Create debounced request
    const promise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        try {
          const result = await fetcher();
          
          // Cache the result
          this.cache.set(key, {
            data: result,
            timestamp: now
          });
          
          // Clear pending request
          this.pendingRequests.delete(key);
          this.timeouts.delete(key);
          
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(key);
          this.timeouts.delete(key);
          reject(error);
        }
      }, this.DEBOUNCE_DELAY);

      this.timeouts.set(key, timeout);
    });

    // Store pending request
    this.pendingRequests.set(key, promise);
    
    return promise;
  }

  /**
   * Get cached data without making a request
   */
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if ((now - cached.timestamp) > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Clear cache for a specific key
   */
  clearCache(key: string): void {
    this.cache.delete(key);
    
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    
    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      activeTimeouts: this.timeouts.size
    };
  }
}

// Global instance
export const requestDebouncer = new RequestDebouncer();

// Debounced fetch wrapper for API calls
export async function debouncedApiCall<T>(
  endpoint: string,
  options?: RequestInit,
  cacheDuration?: number
): Promise<T> {
  const key = `${endpoint}_${JSON.stringify(options || {})}`;
  
  return requestDebouncer.debouncedFetch(
    key,
    async () => {
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      return response.json();
    },
    cacheDuration
  );
}