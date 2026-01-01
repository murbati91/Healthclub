/**
 * WhatsApp Message Templates
 * Predefined message templates for driver and customer notifications
 */

import { Order, DeliveryAddress } from '@/types';

/**
 * Format delivery address for WhatsApp message
 */
function formatAddress(address: DeliveryAddress | string): string {
  if (typeof address === 'string') {
    return address;
  }

  const parts = [
    address.area,
    `Block ${address.block}`,
    `Road ${address.road}`,
    `Building ${address.building}`,
    address.flat ? `Flat ${address.flat}` : null,
  ].filter(Boolean);

  const formatted = parts.join(', ');

  if (address.notes) {
    return `${formatted}\n📝 ${address.notes}`;
  }

  return formatted;
}

/**
 * Notification sent to driver when a new order is assigned
 */
export function driverOrderNotification(
  order: Order & {
    customer_name: string;
    customer_phone: string;
    package_type: string;
  }
): string {
  const address = formatAddress(order.delivery_address);
  const timeSlot = order.delivery_time_slot || 'Not specified';

  return `🍽️ *New Delivery Assigned!*

📅 *Date:* ${new Date(order.delivery_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}

👤 *Customer:* ${order.customer_name}
📱 *Phone:* ${order.customer_phone}

🏠 *Address:*
${address}

📦 *Package:* ${order.package_type}
🕐 *Time Slot:* ${timeSlot}

${order.notes ? `📝 *Notes:* ${order.notes}\n\n` : ''}*Reply with:*
1️⃣ to ACCEPT
2️⃣ to REJECT

_Order ID: ${order.id}_`;
}

/**
 * Reminder sent to driver 30 minutes before delivery
 */
export function driverDeliveryReminder(
  order: Order & {
    customer_name: string;
    customer_phone: string;
  }
): string {
  const address = formatAddress(order.delivery_address);

  return `⏰ *Delivery Reminder*

You have a delivery in 30 minutes!

👤 *Customer:* ${order.customer_name}
📱 *Phone:* ${order.customer_phone}

🏠 *Address:*
${address}

_Order ID: ${order.id}_`;
}

/**
 * Confirmation sent to customer after order is created
 */
export function customerOrderConfirmed(
  order: Order & {
    driver_name?: string;
    package_type: string;
  }
): string {
  const timeSlot = order.delivery_time_slot || 'as scheduled';

  return `✅ *Your meal is being prepared!*

📅 *Delivery Date:* ${new Date(order.delivery_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}

🕐 *Time:* ${timeSlot}

📦 *Package:* ${order.package_type}

${order.driver_name ? `🚗 *Driver:* ${order.driver_name}\n\n` : ''}We'll notify you when your meal is out for delivery.

_Healthy Club - Healthy Meals, Delivered Fresh_ 🥗`;
}

/**
 * Notification sent to customer when meal is out for delivery
 */
export function customerOutForDelivery(
  order: Order & {
    driver_name: string;
    driver_phone: string;
  }
): string {
  return `🚗 *Your meal is out for delivery!*

Driver *${order.driver_name}* is on the way.

📱 *Driver Contact:* ${order.driver_phone}

Expected arrival within your selected time slot.

_Healthy Club - Fresh & Healthy_ 🥗`;
}

/**
 * Confirmation sent to customer when meal is delivered
 */
export function customerDelivered(): string {
  return `✅ *Delivered Successfully!*

Enjoy your healthy meal! 🥗

Thank you for choosing Healthy Club.

_Have feedback? Reply to this message!_`;
}

/**
 * Notification when driver accepts the order
 */
export function driverAccepted(driverName: string): string {
  return `✅ Driver ${driverName} has accepted your order.

Your meal will be delivered as scheduled.`;
}

/**
 * Notification when order is cancelled
 */
export function orderCancelled(reason?: string): string {
  return `❌ *Order Cancelled*

Your order has been cancelled.${reason ? `\n\nReason: ${reason}` : ''}

If you have any questions, please contact us.

_Healthy Club Support_`;
}

/**
 * Daily summary for driver (multiple orders)
 */
export function driverDailySummary(
  orders: Array<Order & { customer_name: string }>,
  date: string
): string {
  const orderCount = orders.length;

  let message = `📋 *Daily Delivery Schedule*

📅 *Date:* ${new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}

📦 *Total Deliveries:* ${orderCount}

---

`;

  orders.forEach((order, index) => {
    const address = formatAddress(order.delivery_address);
    message += `*${index + 1}.* ${order.customer_name}
🏠 ${address.split('\n')[0]}
🕐 ${order.delivery_time_slot || 'TBD'}

`;
  });

  message += `_Check individual orders for full details_`;

  return message;
}

/**
 * Weekly summary for customer
 */
export function customerWeeklySummary(
  deliveryDays: string[],
  packageType: string,
  mealsPerDay: number
): string {
  return `📅 *Your Weekly Meal Plan*

📦 *Package:* ${packageType}
🍽️ *Meals per day:* ${mealsPerDay}

*Delivery Days:*
${deliveryDays.map(day => `✓ ${day}`).join('\n')}

Your meals will be delivered fresh each day during your selected time slot.

_Healthy Club - Plan, Prepare, Deliver_ 🥗`;
}

/**
 * Subscription pause notification
 */
export function subscriptionPaused(resumeDate?: string): string {
  return `⏸️ *Subscription Paused*

Your meal deliveries have been paused.

${resumeDate ? `Resume Date: ${new Date(resumeDate).toLocaleDateString('en-GB')}` : 'Contact us to resume your subscription.'}

_Healthy Club_`;
}

/**
 * Subscription resumed notification
 */
export function subscriptionResumed(nextDelivery: string): string {
  return `▶️ *Subscription Resumed*

Welcome back! Your meal deliveries have been resumed.

📅 *Next Delivery:* ${new Date(nextDelivery).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}

_Healthy Club - Fresh Start!_ 🥗`;
}

/**
 * Payment reminder
 */
export function paymentReminder(amount: number, dueDate: string): string {
  return `💳 *Payment Reminder*

Your subscription payment is due.

💰 *Amount:* BHD ${amount.toFixed(3)}
📅 *Due Date:* ${new Date(dueDate).toLocaleDateString('en-GB')}

Please ensure payment is made to continue your meal deliveries.

_Healthy Club_`;
}

/**
 * Emergency notification (service disruption)
 */
export function serviceDisruption(message: string): string {
  return `⚠️ *Service Update*

${message}

We apologize for any inconvenience. We'll keep you updated.

_Healthy Club Support_`;
}
