/**
 * CORS Middleware
 */

import { NextResponse } from 'next/server';

export function withCors(handler: Function) {
  return async (...args: any[]) => {
    const response = await handler(...args);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  };
}
