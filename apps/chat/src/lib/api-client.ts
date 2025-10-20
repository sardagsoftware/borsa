/**
 * API Client for Lydian Gateway
 * Handles communication with backend actions API
 */

const GATEWAY_API_URL = process.env.NEXT_PUBLIC_GATEWAY_API_URL || 'http://localhost:3100';

export interface ActionRequest {
  action: string;
  payload: Record<string, any>;
  scopes?: string[];
}

export interface ActionResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    requestId: string;
    responseTime: number;
  };
}

export interface ChatResponse {
  content: string;
  toolCalls?: Array<{
    action: string;
    payload: Record<string, any>;
    result?: ActionResponse;
    status: 'pending' | 'running' | 'success' | 'error';
  }>;
}

/**
 * Execute an action via Gateway API
 */
export async function executeAction(request: ActionRequest): Promise<ActionResponse> {
  const response = await fetch(`${GATEWAY_API_URL}/api/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available actions
 */
export async function getActions(): Promise<any[]> {
  const response = await fetch(`${GATEWAY_API_URL}/api/actions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch actions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.actions || [];
}

/**
 * Send chat message (placeholder - will be implemented with AI later)
 */
export async function sendChatMessage(
  message: string,
  conversationId: string
): Promise<ChatResponse> {
  // TODO: Implement actual chat API with AI reasoning
  // For now, return mock response

  // Parse user intent (simple keyword matching for demo)
  const lowerMessage = message.toLowerCase();

  // Check for action keywords
  if (lowerMessage.includes('ürün') && lowerMessage.includes('yükle')) {
    return {
      content: 'Ürün yükleme işlemi için önce hangi platforma yüklemek istediğinizi belirtir misiniz? (Trendyol, Hepsiburada)',
      toolCalls: [],
    };
  }

  if (lowerMessage.includes('sipariş') && lowerMessage.includes('listele')) {
    return {
      content: 'Siparişlerinizi listeliyorum...',
      toolCalls: [
        {
          action: 'order.list',
          payload: {
            restaurantId: 'demo_restaurant',
            status: 'confirmed',
            limit: 10,
          },
          status: 'pending',
        },
      ],
    };
  }

  // Default response
  return {
    content: `Anladım: "${message}"\n\nŞu anda temel bir demo çalışıyorum. Yakında tam AI entegrasyonu ile:\n\n✅ Doğal dil işleme\n✅ Otomatik action çağırma\n✅ Multi-step workflows\n✅ Context awareness\n\nKullanılabilir komutlar:\n- "Siparişleri listele" → order.list action\n- "Ürün yükle" → product.sync action\n- "Menüyü güncelle" → menu.update action`,
    toolCalls: [],
  };
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${GATEWAY_API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
