/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscription and payment lifecycle
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  constructWebhookEvent,
  handleSubscriptionEvent,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import { sendUpcomingInvoiceNotification } from "@/lib/notifications/service";
import { createLogger } from "@/lib/logging/logger";

const log = createLogger("stripe-webhook");

/**
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      log.error("No Stripe signature found");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify and construct the event
    const event = constructWebhookEvent(payload, signature);

    if (!event) {
      log.error("Failed to verify Stripe webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    log.info("Processing Stripe event", { type: event.type });

    // Handle the event based on type
    switch (event.type) {
      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(subscription);
        log.info("Subscription event processed", { type: event.type, subscriptionId: subscription.id });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        log.info("Subscription deleted", { subscriptionId: subscription.id });
        break;
      }

      // Invoice events
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        log.info("Invoice paid", { invoiceId: invoice.id });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        log.error("Invoice payment failed", undefined, { invoiceId: invoice.id });
        break;
      }

      case "invoice.upcoming": {
        // Send notification about upcoming charge
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

        if (customerId) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (user && invoice.amount_due && invoice.due_date) {
            await sendUpcomingInvoiceNotification({
              userId: user.id,
              amount: invoice.amount_due,
              currency: invoice.currency,
              dueDate: new Date(invoice.due_date * 1000).toLocaleDateString(),
              planName: user.plan || "Pro",
            });
            log.info("Upcoming invoice notification sent", { userId: user.id });
          }
        }
        break;
      }

      // Checkout events
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log.info("Checkout completed", { sessionId: session.id });
        // Subscription is handled by subscription.created event
        break;
      }

      // Customer events
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        log.info("Customer created", { customerId: customer.id });
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        log.info("Customer updated", { customerId: customer.id });
        break;
      }

      // Payment method events
      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        log.info("Payment method attached", { paymentMethodId: paymentMethod.id });
        break;
      }

      case "payment_method.detached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        log.info("Payment method detached", { paymentMethodId: paymentMethod.id });
        break;
      }

      // Payment intent events (for one-time payments if needed)
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.info("Payment succeeded", { paymentIntentId: paymentIntent.id });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log.error("Payment failed", undefined, { paymentIntentId: paymentIntent.id });
        break;
      }

      default:
        log.warn("Unhandled event type", { type: event.type });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("Stripe webhook processing error", error instanceof Error ? error : undefined);
    // Return 500 so Stripe retries the webhook for transient failures
    // (e.g., database connection issues). Signature verification errors
    // are already handled above with 400 status.
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
