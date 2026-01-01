/**
 * Order Automation Logic
 * Handles automated WhatsApp notifications for order lifecycle
 */

import { createServerSupabaseClient } from '@/lib/supabase';
import { sendMessage, parseDriverResponse, extractPhoneFromChatId } from '@/lib/waha';
import {
  driverOrderNotification,
  driverDeliveryReminder,
  customerOrderConfirmed,
  customerOutForDelivery,
  customerDelivered,
  driverAccepted,
} from '@/lib/whatsapp-templates';
import { Order, OrderStatus } from '@/types';

/**
 * Log a WhatsApp message to the database
 */
async function logWhatsAppMessage(data: {
  order_id?: string;
  recipient_phone: string;
  message_type: string;
  message_content: string;
  status: 'sent' | 'failed';
  error_message?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      order_id: data.order_id || null,
      recipient_phone: data.recipient_phone,
      message_type: data.message_type,
      message_content: data.message_content,
      status: data.status,
      error_message: data.error_message || null,
      sent_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to log WhatsApp message:', error);
  }
}

/**
 * Get order details with related data
 */
async function getOrderDetails(orderId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      *,
      subscription:subscriptions (
        package_type,
        user_id,
        delivery_address
      ),
      driver:profiles!orders_driver_id_fkey (
        full_name,
        phone
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Get customer details
  const { data: customer, error: customerError } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', order.subscription.user_id)
    .single();

  if (customerError || !customer) {
    throw new Error(`Customer not found for order: ${orderId}`);
  }

  return {
    ...order,
    customer_name: customer.full_name,
    customer_phone: customer.phone,
    driver_name: order.driver?.full_name,
    driver_phone: order.driver?.phone,
    package_type: order.subscription.package_type,
  };
}

/**
 * Notify driver of new order assignment
 */
export async function notifyDriverOfOrder(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId);

    if (!order.driver_phone) {
      throw new Error('No driver assigned to this order');
    }

    // Send WhatsApp notification
    const message = driverOrderNotification(order);

    await sendMessage(order.driver_phone, message);

    // Update order with notification timestamp
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('orders')
      .update({ driver_notified_at: new Date().toISOString() })
      .eq('id', orderId);

    // Log the message
    await logWhatsAppMessage({
      order_id: orderId,
      recipient_phone: order.driver_phone,
      message_type: 'driver_order_notification',
      message_content: message,
      status: 'sent',
    });

    console.log(`Driver notified for order ${orderId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to notify driver:', error);

    // Log the failed attempt
    const order = await getOrderDetails(orderId);
    if (order.driver_phone) {
      await logWhatsAppMessage({
        order_id: orderId,
        recipient_phone: order.driver_phone,
        message_type: 'driver_order_notification',
        message_content: '',
        status: 'failed',
        error_message: errorMessage,
      });
    }

    throw error;
  }
}

/**
 * Send delivery reminder to driver 30 minutes before delivery
 */
export async function sendDeliveryReminder(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId);

    if (!order.driver_phone) {
      throw new Error('No driver assigned to this order');
    }

    const message = driverDeliveryReminder(order);

    await sendMessage(order.driver_phone, message);

    await logWhatsAppMessage({
      order_id: orderId,
      recipient_phone: order.driver_phone,
      message_type: 'driver_delivery_reminder',
      message_content: message,
      status: 'sent',
    });

    console.log(`Delivery reminder sent for order ${orderId}`);
  } catch (error) {
    console.error('Failed to send delivery reminder:', error);
    throw error;
  }
}

/**
 * Notify customer of order status change
 */
export async function notifyCustomerStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    const order = await getOrderDetails(orderId);

    if (!order.customer_phone) {
      throw new Error('No customer phone found for this order');
    }

    let message: string;
    let messageType: string;

    switch (status) {
      case 'scheduled':
        message = customerOrderConfirmed(order);
        messageType = 'customer_order_confirmed';
        break;

      case 'out_for_delivery':
        if (!order.driver_name || !order.driver_phone) {
          throw new Error('Driver information required for out_for_delivery status');
        }
        message = customerOutForDelivery(order);
        messageType = 'customer_out_for_delivery';
        break;

      case 'delivered':
        message = customerDelivered();
        messageType = 'customer_delivered';
        break;

      default:
        console.log(`No notification template for status: ${status}`);
        return;
    }

    await sendMessage(order.customer_phone, message);

    await logWhatsAppMessage({
      order_id: orderId,
      recipient_phone: order.customer_phone,
      message_type: messageType,
      message_content: message,
      status: 'sent',
    });

    console.log(`Customer notified for order ${orderId}, status: ${status}`);
  } catch (error) {
    console.error('Failed to notify customer:', error);
    throw error;
  }
}

/**
 * Process driver response to order notification
 */
export async function processDriverResponse(
  driverPhone: string,
  messageBody: string,
  orderId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = parseDriverResponse(messageBody);

    if (!response) {
      return {
        success: false,
        message: 'Invalid response. Please reply with 1 to accept or 2 to reject.',
      };
    }

    const supabase = await createServerSupabaseClient();

    // If no orderId provided, find the most recent pending order for this driver
    if (!orderId) {
      const { data: driver } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', driverPhone)
        .eq('role', 'driver')
        .single();

      if (!driver) {
        return { success: false, message: 'Driver not found' };
      }

      const { data: recentOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('driver_id', driver.id)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!recentOrder) {
        return {
          success: false,
          message: 'No pending orders found',
        };
      }

      orderId = recentOrder.id;
    }

    // At this point orderId is guaranteed to be defined
    const finalOrderId = orderId as string;

    if (response === 'accept') {
      // Update order status to preparing
      await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', finalOrderId);

      // Notify customer
      await notifyCustomerStatus(finalOrderId, 'scheduled');

      return {
        success: true,
        message: '✅ Order accepted! Customer has been notified.',
      };
    } else if (response === 'reject') {
      // Log the rejection and potentially reassign
      await supabase
        .from('orders')
        .update({
          driver_id: null,
          driver_notified_at: null,
          notes: 'Driver rejected the order',
        })
        .eq('id', finalOrderId);

      return {
        success: true,
        message: '❌ Order rejected. It will be reassigned to another driver.',
      };
    }

    return { success: false, message: 'Unknown response' };
  } catch (error) {
    console.error('Failed to process driver response:', error);
    return {
      success: false,
      message: 'Error processing response. Please contact support.',
    };
  }
}

/**
 * Schedule delivery reminders for orders
 * Should be called by a cron job/scheduled task
 */
export async function scheduleDeliveryReminders(): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Get orders scheduled for delivery in the next 30 minutes
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, delivery_date, delivery_time_slot')
    .in('status', ['scheduled', 'preparing'])
    .gte('delivery_date', now.toISOString())
    .lte('delivery_date', thirtyMinutesFromNow.toISOString());

  if (error) {
    console.error('Failed to fetch orders for reminders:', error);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('No orders found for delivery reminders');
    return;
  }

  // Send reminders
  const reminderPromises = orders.map((order) => sendDeliveryReminder(order.id));

  await Promise.allSettled(reminderPromises);

  console.log(`Sent ${orders.length} delivery reminders`);
}

/**
 * Auto-notify driver when order is assigned
 * Should be called after order creation or driver assignment
 */
export async function autoNotifyDriver(orderId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Check if driver was already notified
  const { data: order } = await supabase
    .from('orders')
    .select('driver_id, driver_notified_at')
    .eq('id', orderId)
    .single();

  if (!order?.driver_id) {
    console.log('No driver assigned, skipping notification');
    return;
  }

  if (order.driver_notified_at) {
    console.log('Driver already notified, skipping');
    return;
  }

  await notifyDriverOfOrder(orderId);
}
