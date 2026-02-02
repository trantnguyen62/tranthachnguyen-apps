/**
 * Stripe Integration
 * Handles Stripe API interactions for subscriptions, checkout, and billing portal
 */

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === "production") {
  console.warn("STRIPE_SECRET_KEY is not set");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      // @ts-expect-error - Using a slightly older API version for compatibility
      apiVersion: "2025-01-27.acacia",
      typescript: true,
    })
  : null;

// Price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
  TEAM_MONTHLY: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "",
  TEAM_YEARLY: process.env.STRIPE_TEAM_YEARLY_PRICE_ID || "",
};

// ============ Customer Management ============

/**
 * Get or create Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string): Promise<string | null> {
  if (!stripe) return null;

  // Check if user already has a Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) return null;

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  // Save customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  if (!stripe) return [];

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data;
}

// ============ Subscription Management ============

/**
 * Get user's active subscription
 */
export async function getSubscription(
  userId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;

  const customerId = await getOrCreateCustomer(userId);
  if (!customerId) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Get subscription details including current period and usage
 */
export async function getSubscriptionDetails(userId: string): Promise<{
  subscription: Stripe.Subscription | null;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}> {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    return {
      subscription: null,
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let plan = "pro";

  if (
    priceId === STRIPE_PRICES.TEAM_MONTHLY ||
    priceId === STRIPE_PRICES.TEAM_YEARLY
  ) {
    plan = "team";
  }

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  return {
    subscription,
    plan,
    status: subscription.status,
    currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  if (!stripe) return false;

  const subscription = await getSubscription(userId);
  if (!subscription) return false;

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  return true;
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(userId: string): Promise<boolean> {
  if (!stripe) return false;

  const subscription = await getSubscription(userId);
  if (!subscription) return false;

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
  });

  return true;
}

// ============ Checkout ============

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  const customerId = await getOrCreateCustomer(userId);
  if (!customerId) return null;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });

  return session.url;
}

/**
 * Create billing portal session
 */
export async function createPortalSession(
  userId: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  const customerId = await getOrCreateCustomer(userId);
  if (!customerId) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ============ Invoices ============

/**
 * Get customer's invoices
 */
export async function getInvoices(
  userId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  if (!stripe) return [];

  const customerId = await getOrCreateCustomer(userId);
  if (!customerId) return [];

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

/**
 * Get upcoming invoice
 */
export async function getUpcomingInvoice(
  userId: string
): Promise<Stripe.Invoice | null> {
  if (!stripe) return null;

  const customerId = await getOrCreateCustomer(userId);
  if (!customerId) return null;

  try {
    const invoice = await stripe.invoices.createPreview({
      customer: customerId,
    });
    return invoice;
  } catch {
    // No upcoming invoice
    return null;
  }
}

// ============ Usage-Based Billing ============

/**
 * Report usage to Stripe via Billing Meters
 * Note: Stripe's usage-based billing now uses the Billing.Meters API
 */
export async function reportUsage(
  meterId: string,
  customerId: string,
  value: number,
  timestamp?: number
): Promise<boolean> {
  if (!stripe) return false;

  try {
    await stripe.billing.meterEvents.create({
      event_name: meterId,
      payload: {
        stripe_customer_id: customerId,
        value: String(value),
      },
      timestamp: timestamp || Math.floor(Date.now() / 1000),
    });
    return true;
  } catch (error) {
    console.error("Failed to report usage:", error);
    return false;
  }
}

/**
 * Get meter event summaries for a customer
 */
export async function getUsageRecords(
  meterId: string,
  customerId: string,
  startTime: number,
  endTime: number
): Promise<Stripe.Billing.MeterEventSummary[]> {
  if (!stripe) return [];

  try {
    const summaries = await stripe.billing.meters.listEventSummaries(
      meterId,
      {
        customer: customerId,
        start_time: startTime,
        end_time: endTime,
      }
    );
    return summaries.data;
  } catch (error) {
    console.error("Failed to get usage records:", error);
    return [];
  }
}

// ============ Webhook Event Handling ============

/**
 * Construct and verify webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
}

/**
 * Handle subscription created/updated event
 */
export async function handleSubscriptionEvent(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  // Determine plan from price
  const priceId = subscription.items.data[0]?.price.id;
  let plan = "pro";

  if (
    priceId === STRIPE_PRICES.TEAM_MONTHLY ||
    priceId === STRIPE_PRICES.TEAM_YEARLY
  ) {
    plan = "team";
  }

  // Get current period end from subscription items
  const periodEnd = subscription.items.data[0]?.current_period_end;

  // Update user's plan in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      type: "billing",
      action: `subscription.${subscription.status}`,
      description: `Subscription ${subscription.status}: ${plan} plan`,
      metadata: {
        subscriptionId: subscription.id,
        plan,
        priceId,
      },
    },
  });
}

/**
 * Handle subscription deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  // Downgrade to free plan
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      subscriptionStatus: "canceled",
      subscriptionId: null,
      currentPeriodEnd: null,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      type: "billing",
      action: "subscription.canceled",
      description: "Subscription canceled, downgraded to free plan",
      metadata: {
        subscriptionId: subscription.id,
      },
    },
  });
}

/**
 * Handle invoice paid event
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  // Find user by customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: "billing",
      action: "invoice.paid",
      description: `Invoice paid: $${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
      },
    },
  });
}

/**
 * Handle invoice payment failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  // Find user by customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      type: "billing",
      action: "invoice.payment_failed",
      description: "Invoice payment failed",
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
      },
    },
  });

  // TODO: Send notification to user about failed payment
}
