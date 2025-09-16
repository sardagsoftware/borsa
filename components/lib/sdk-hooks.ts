// SDK hooks wrapper for dynamic imports
import { useState, useEffect } from 'react';

// Demo hooks for fallback
export const useFn = (fnName: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const call = async (args: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window !== 'undefined') {
        // Try to use real SDK
        try {
          const { useFn: realUseFn } = await import('../../packages/sdk/src/hooks');
          return await realUseFn(fnName).call(args);
        } catch {
          // Fallback to demo mode
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, data: { message: 'Demo mode result' } };
        }
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { call, isLoading, error };
};

export const useStream = (topic: string) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to use real streaming
      const tryRealStream = async () => {
        try {
          const { useStream: realUseStream } = await import('../../packages/sdk/src/hooks');
          return realUseStream(topic);
        } catch {
          // Fallback to demo polling
          const interval = setInterval(() => {
            setData({
              timestamp: Date.now(),
              value: Math.random() * 1000,
              topic
            });
            setIsConnected(true);
          }, 2000);
          
          return () => clearInterval(interval);
        }
      };
      
      tryRealStream();
    }
  }, [topic]);
  
  return { data, isConnected };
};
