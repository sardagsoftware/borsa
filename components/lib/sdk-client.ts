// SDK Client wrapper for dynamic imports
import dynamic from 'next/dynamic';

let client: any = null;

if (typeof window !== 'undefined') {
  // Client-side only
  const initializeClient = async () => {
    try {
      const { AilydianClient } = await import('../../packages/sdk/src/client');
      client = new AilydianClient();
    } catch (error) {
      console.warn('SDK client not available:', error);
      // Fallback client for demo mode
      client = {
        call: async (fnName: string, args: any) => {
          return { success: true, data: { message: 'Demo mode' } };
        }
      };
    }
  };
  
  initializeClient();
}

export default client;
