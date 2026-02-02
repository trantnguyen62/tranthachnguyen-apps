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

/**
 * POST /api/webhooks/stripe - Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify and construct the event
    const event = constructWebhookEvent(payload, signature);

    if (!event) {
      console.error("Failed to verify Stripe webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle the event based on type
    switch (event.type) {
      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(subscription);
        console.log(`Subscription ${event.type}: ${subscription.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        console.log(`Subscription deleted: ${subscription.id}`);
        break;
      }

      // Invoice events
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        console.log(`Invoice paid: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        console.log(`Invoice payment failed: ${invoice.id}`);
        break;
      }

      case "invoice.upcoming": {
        // Informational - could trigger notification about upcoming charge
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Upcoming invoice for customer: ${invoice.customer}`);
        // TODO: Send notification about upcoming charge
        break;
      }

      // Checkout events
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed: ${session.id}`);
        // Subscription is handled by subscription.created event
        break;
      }

      // Customer events
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`Customer created: ${customer.id}`);
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        console.log(`Customer updated: ${customer.id}`);
        break;
      }

      // Payment method events
      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log(`Payment method attached: ${paymentMethod.id}`);
        break;
      }

      case "payment_method.detached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log(`Payment method detached: ${paymentMethod.id}`);
        break;
      }

      // Payment intent events (for one-time payments if needed)
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 anyway to prevent Stripe from retrying
    // Log the error for investigation
    return NextResponse.json(
      { error: "Webhook handler failed", received: true },
      { status: 200 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
