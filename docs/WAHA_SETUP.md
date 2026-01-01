# WAHA Setup Guide

**WAHA** (WhatsApp HTTP API) is a self-hosted WhatsApp API that allows you to send and receive WhatsApp messages programmatically. This guide will help you set up WAHA for the Healthy Club application.

## What is WAHA?

WAHA is a lightweight, Docker-based WhatsApp API that provides:
- Send text messages
- Send messages with buttons
- Receive incoming messages via webhooks
- Multiple session support
- Easy deployment

**Official Documentation:** https://waha.devlike.pro/

## Prerequisites

- Docker installed on your server
- A dedicated phone number for WhatsApp Business (recommended)
- Access to your server via SSH
- Domain name with SSL certificate (for webhooks)

## Installation

### 1. Install Docker

If Docker is not already installed:

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
```

### 2. Run WAHA Container

```bash
# Pull and run WAHA
docker run -d \
  --name waha \
  -p 3001:3000 \
  --restart unless-stopped \
  -e WHATSAPP_HOOK_URL=https://your-domain.com/api/whatsapp/webhook \
  -e WHATSAPP_HOOK_EVENTS=message \
  -v ~/.waha:/app/.sessions \
  devlikeapro/waha
```

**Environment Variables:**
- `WHATSAPP_HOOK_URL`: Your webhook URL (replace with your domain)
- `WHATSAPP_HOOK_EVENTS`: Events to forward to webhook (comma-separated)
- `-v ~/.waha:/app/.sessions`: Persist session data

### 3. Verify WAHA is Running

```bash
# Check container status
docker ps | grep waha

# View logs
docker logs waha

# Test API
curl http://localhost:3001/api/sessions
```

## Session Configuration

### 1. Start a New Session

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "default",
    "config": {
      "webhooks": [
        {
          "url": "https://your-domain.com/api/whatsapp/webhook",
          "events": ["message"]
        }
      ]
    }
  }'
```

### 2. Get QR Code

```bash
# Get QR code for authentication
curl http://localhost:3001/api/sessions/default/auth/qr
```

The response will contain a QR code image URL. Open it in your browser and scan with WhatsApp.

**Alternative:** Use WAHA Dashboard at `http://localhost:3001/dashboard`

### 3. Verify Session Status

```bash
curl http://localhost:3001/api/sessions/default
```

Status should be `WORKING` when successfully connected.

## Webhook Configuration

### 1. Update Environment Variables

In your `.env.local` file:

```env
WAHA_API_URL=http://localhost:3001
WAHA_SESSION_NAME=default
WAHA_API_KEY=your-secure-api-key
```

### 2. Configure Webhook in WAHA

The webhook is automatically configured when you start the session (see step above).

To update webhook settings:

```bash
curl -X PUT http://localhost:3001/api/sessions/default \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "webhooks": [
        {
          "url": "https://your-domain.com/api/whatsapp/webhook",
          "events": ["message", "message.ack"]
        }
      ]
    }
  }'
```

### 3. Test Webhook

Send a message to your WhatsApp number and check your application logs:

```bash
# Next.js development server logs
npm run dev

# Or check production logs
pm2 logs healthy-club
```

You should see incoming webhook events in the logs.

## Security Considerations

### 1. Enable API Key Authentication

```bash
docker run -d \
  --name waha \
  -p 3001:3000 \
  --restart unless-stopped \
  -e WHATSAPP_API_KEY=your-secure-random-key \
  -e WHATSAPP_HOOK_URL=https://your-domain.com/api/whatsapp/webhook \
  -v ~/.waha:/app/.sessions \
  devlikeapro/waha
```

Update your `.env.local`:

```env
WAHA_API_KEY=your-secure-random-key
```

### 2. Use HTTPS for Webhooks

Ensure your webhook URL uses HTTPS with a valid SSL certificate.

### 3. Restrict Access

Use firewall rules to restrict access to WAHA:

```bash
# Allow only from localhost
sudo ufw allow from 127.0.0.1 to any port 3001

# Or allow from specific IP
sudo ufw allow from YOUR_APP_SERVER_IP to any port 3001
```

## Database Setup

Create the `whatsapp_messages` table in Supabase:

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'received')),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_order_id ON whatsapp_messages(order_id);
CREATE INDEX idx_whatsapp_messages_recipient ON whatsapp_messages(recipient_phone);
CREATE INDEX idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);
CREATE INDEX idx_whatsapp_messages_type ON whatsapp_messages(message_type);

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all messages
CREATE POLICY "Admins can view all WhatsApp messages"
ON whatsapp_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow service role to insert
CREATE POLICY "Service can insert WhatsApp messages"
ON whatsapp_messages FOR INSERT
TO service_role
WITH CHECK (true);
```

## Testing

### 1. Test Sending Messages

```bash
curl -X POST http://localhost:3001/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "97335795836@c.us",
    "text": "Test message from WAHA",
    "session": "default"
  }'
```

### 2. Test Webhook Integration

From your application:

```typescript
// Test via API route
fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '35795836',
    message: 'Test notification'
  })
});
```

### 3. Test Driver Notification

```typescript
// Notify driver for an order
fetch('/api/orders/notify-driver', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order-uuid-here'
  })
});
```

## Automation Flow

### 1. Order Creation → Driver Notification

When an order is created and assigned to a driver:

```typescript
import { autoNotifyDriver } from '@/lib/order-automation';

// After creating order
await autoNotifyDriver(orderId);
```

### 2. Driver Response → Update Order

Driver replies with "1" (accept) or "2" (reject):
- Webhook receives message
- Processes driver response
- Updates order status
- Notifies customer

### 3. Status Updates → Customer Notification

When order status changes:

```typescript
import { notifyCustomerStatus } from '@/lib/order-automation';

// Update order status
await supabase
  .from('orders')
  .update({ status: 'out_for_delivery' })
  .eq('id', orderId);

// Notify customer
await notifyCustomerStatus(orderId, 'out_for_delivery');
```

### 4. Scheduled Reminders

Set up a cron job to send delivery reminders:

```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * curl -X POST http://localhost:3000/api/cron/delivery-reminders
```

Create the cron endpoint:

```typescript
// app/api/cron/delivery-reminders/route.ts
import { scheduleDeliveryReminders } from '@/lib/order-automation';

export async function POST() {
  await scheduleDeliveryReminders();
  return Response.json({ success: true });
}
```

## Troubleshooting

### Session Not Working

1. Check session status:
```bash
curl http://localhost:3001/api/sessions/default
```

2. Restart session:
```bash
curl -X DELETE http://localhost:3001/api/sessions/default
# Then create new session and scan QR again
```

### Messages Not Sending

1. Check WAHA logs:
```bash
docker logs waha -f
```

2. Verify phone number format:
   - Bahrain: `973XXXXXXXX` (no spaces, no +)
   - Format: `{country_code}{number}@c.us`

3. Test connection:
```typescript
import { testWAHAConnection } from '@/lib/waha';

const result = await testWAHAConnection();
console.log(result);
```

### Webhook Not Receiving Messages

1. Verify webhook URL is accessible:
```bash
curl https://your-domain.com/api/whatsapp/webhook
```

2. Check WAHA webhook configuration:
```bash
curl http://localhost:3001/api/sessions/default | jq .config.webhooks
```

3. Test webhook manually:
```bash
curl -X POST https://your-domain.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "session": "default",
    "payload": {
      "id": "test-123",
      "timestamp": 1234567890,
      "from": "97335795836@c.us",
      "fromMe": false,
      "body": "1",
      "hasMedia": false
    }
  }'
```

## Production Deployment

### 1. Use Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha
    container_name: waha
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - WHATSAPP_API_KEY=${WAHA_API_KEY}
      - WHATSAPP_HOOK_URL=${WEBHOOK_URL}
      - WHATSAPP_HOOK_EVENTS=message,message.ack
    volumes:
      - waha_sessions:/app/.sessions

volumes:
  waha_sessions:
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

### 3. Monitor Health

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f waha
```

## Best Practices

1. **Use a Dedicated Phone Number**: Don't use your personal WhatsApp
2. **Enable API Key**: Always use API key authentication in production
3. **Monitor Logs**: Set up log monitoring for WhatsApp messages
4. **Rate Limiting**: WhatsApp has rate limits, implement queuing for bulk messages
5. **Backup Sessions**: Regularly backup the `.sessions` directory
6. **Use HTTPS**: Always use HTTPS for webhooks
7. **Error Handling**: Log all failed messages for retry

## Support

- **WAHA Documentation**: https://waha.devlike.pro/
- **WAHA GitHub**: https://github.com/devlikeapro/waha
- **Discord Community**: https://discord.gg/waha

## Cost

WAHA is **free and open-source**. You only pay for:
- Server hosting (DigitalOcean, AWS, etc.)
- WhatsApp phone line (if using dedicated number)

Recommended: DigitalOcean droplet ($6/month) is sufficient for WAHA.
