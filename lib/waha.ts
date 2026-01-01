/**
 * WAHA (WhatsApp HTTP API) Client
 * https://waha.devlike.pro/
 *
 * This client provides methods to interact with the WAHA API for sending
 * WhatsApp messages, managing sessions, and handling webhooks.
 */

// Environment configuration
const WAHA_API_URL = process.env.WAHA_API_URL || 'http://localhost:3001';
const WAHA_SESSION_NAME = process.env.WAHA_SESSION_NAME || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

// Type definitions for WAHA API
export interface WAHAMessage {
  chatId: string;
  text: string;
  session?: string;
}

export interface WAHAButton {
  id: string;
  text: string;
}

export interface WAHAButtonMessage {
  chatId: string;
  text: string;
  buttons: WAHAButton[];
  footer?: string;
  session?: string;
}

export interface WAHASession {
  name: string;
  status: 'WORKING' | 'STARTING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
  config?: {
    webhooks?: Array<{
      url: string;
      events: string[];
    }>;
  };
}

export interface WAHASendMessageResponse {
  id: string;
  timestamp: number;
  ack?: number;
}

export interface WAHAWebhookEvent {
  event: string;
  session: string;
  payload: {
    id: string;
    timestamp: number;
    from: string;
    fromMe: boolean;
    body: string;
    hasMedia: boolean;
    ack?: number;
  };
}

/**
 * Format phone number for WhatsApp (international format without + or spaces)
 * Example: "35795836366" (Bahrain number)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, assume it's local Bahrain number, add 973
  if (cleaned.startsWith('0')) {
    cleaned = '973' + cleaned.substring(1);
  }

  // If doesn't start with country code, assume Bahrain (973)
  if (!cleaned.startsWith('973')) {
    cleaned = '973' + cleaned;
  }

  return cleaned;
}

/**
 * Format phone number for WhatsApp chat ID
 * Example: "35795836366@c.us"
 */
export function formatChatId(phone: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  return `${formattedPhone}@c.us`;
}

/**
 * Make a request to the WAHA API
 */
async function wahaRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WAHA_API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add API key if configured
  if (WAHA_API_KEY) {
    headers['X-Api-Key'] = WAHA_API_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WAHA API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Send a simple text message via WhatsApp
 */
export async function sendMessage(
  phone: string,
  message: string
): Promise<WAHASendMessageResponse> {
  const chatId = formatChatId(phone);

  const payload: WAHAMessage = {
    chatId,
    text: message,
    session: WAHA_SESSION_NAME,
  };

  return wahaRequest<WAHASendMessageResponse>(
    `/api/sendText`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Send a message with interactive buttons
 */
export async function sendMessageWithButtons(
  phone: string,
  message: string,
  buttons: WAHAButton[],
  footer?: string
): Promise<WAHASendMessageResponse> {
  const chatId = formatChatId(phone);

  const payload: WAHAButtonMessage = {
    chatId,
    text: message,
    buttons,
    footer,
    session: WAHA_SESSION_NAME,
  };

  return wahaRequest<WAHASendMessageResponse>(
    `/api/sendButtons`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Get the status of the WhatsApp session
 */
export async function getSessionStatus(): Promise<WAHASession> {
  return wahaRequest<WAHASession>(
    `/api/sessions/${WAHA_SESSION_NAME}`
  );
}

/**
 * Check if WAHA is configured and ready
 */
export async function isWAHAReady(): Promise<boolean> {
  try {
    const session = await getSessionStatus();
    return session.status === 'WORKING';
  } catch (error) {
    console.error('WAHA not ready:', error);
    return false;
  }
}

/**
 * Verify that a webhook event is from WAHA
 * You can implement signature verification here if WAHA supports it
 */
export function verifyWebhookEvent(event: WAHAWebhookEvent): boolean {
  // Basic validation
  if (!event.event || !event.session || !event.payload) {
    return false;
  }

  // Verify session name matches
  if (event.session !== WAHA_SESSION_NAME) {
    return false;
  }

  return true;
}

/**
 * Extract phone number from WhatsApp chat ID
 * Example: "35795836366@c.us" -> "35795836366"
 */
export function extractPhoneFromChatId(chatId: string): string {
  return chatId.replace('@c.us', '');
}

/**
 * Parse incoming message for driver responses
 * Returns: 'accept' | 'reject' | null
 */
export function parseDriverResponse(messageBody: string): 'accept' | 'reject' | null {
  const normalized = messageBody.trim().toLowerCase();

  // Check for accept responses
  if (normalized === '1' || normalized === 'accept' || normalized === 'yes') {
    return 'accept';
  }

  // Check for reject responses
  if (normalized === '2' || normalized === 'reject' || normalized === 'no') {
    return 'reject';
  }

  return null;
}

/**
 * Test WAHA connection and configuration
 */
export async function testWAHAConnection(): Promise<{
  success: boolean;
  message: string;
  session?: WAHASession;
}> {
  try {
    const session = await getSessionStatus();

    if (session.status === 'WORKING') {
      return {
        success: true,
        message: 'WAHA is connected and working',
        session,
      };
    } else {
      return {
        success: false,
        message: `WAHA session status: ${session.status}`,
        session,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
