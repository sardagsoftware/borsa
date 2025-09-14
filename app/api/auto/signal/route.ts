// Server-Sent Events for real-time signals
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response('Authentication required', { status: 401 });
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        console.log('🔴 SSE client connected');
        
        // Send initial connection message
        const welcomeMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to signal stream',
          timestamp: new Date().toISOString()
        })}\n\n`;
        
        controller.enqueue(encoder.encode(welcomeMessage));

        // Set up periodic signal updates
        const signalInterval = setInterval(() => {
          try {
            // Generate mock signal data (replace with real signal generation)
            const mockSignals = generateMockSignals();
            
            const signalMessage = `data: ${JSON.stringify({
              type: 'signals',
              data: mockSignals,
              timestamp: new Date().toISOString()
            })}\n\n`;
            
            controller.enqueue(encoder.encode(signalMessage));
            
          } catch (error) {
            console.error('Signal generation error:', error);
          }
        }, 5000); // Send signals every 5 seconds

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(heartbeat));
        }, 30000);

        // Cleanup function
        const cleanup = () => {
          clearInterval(signalInterval);
          clearInterval(heartbeatInterval);
          console.log('🔴 SSE client disconnected');
        };

        // Store cleanup function for potential use
        (controller as any).cleanup = cleanup;

        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          cleanup();
          try {
            controller.close();
          } catch (e) {
            // Controller already closed
          }
        });
      },
      
      cancel() {
        console.log('🔴 SSE stream cancelled');
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Signal SSE error:', error);
    return new Response('Signal stream error', { status: 500 });
  }
}

// Generate mock signal data
function generateMockSignals() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT'];
  
  return symbols.map(symbol => ({
    symbol,
    score: (Math.random() - 0.5) * 200, // -100 to +100
    confidence: Math.random(),
    quality: 0.3 + Math.random() * 0.7,
    regime: ['trend', 'range', 'squeeze', 'shock'][Math.floor(Math.random() * 4)],
    dominantStrategy: ['trend', 'meanReversion', 'breakout', 'microflow'][Math.floor(Math.random() * 4)],
    timestamp: new Date().toISOString()
  }));
}
