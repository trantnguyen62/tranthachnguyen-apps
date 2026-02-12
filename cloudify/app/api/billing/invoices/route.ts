/**
 * Billing Invoices API
 * Get invoice history and upcoming invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { requireReadAccess, isAuthError } from "@/lib/auth/api-auth";
import { getInvoices, getUpcomingInvoice } from "@/lib/billing/stripe";
import { getRouteLogger } from "@/lib/api/logger";

const log = getRouteLogger("billing/invoices");

/**
 * GET /api/billing/invoices - Get invoice history
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireReadAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get past invoices
    const invoices = await getInvoices(user.id, limit);

    // Get upcoming invoice
    const upcomingInvoice = await getUpcomingInvoice(user.id);

    // Format invoices for response
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000),
      periodStart: invoice.period_start
        ? new Date(invoice.period_start * 1000)
        : null,
      periodEnd: invoice.period_end
        ? new Date(invoice.period_end * 1000)
        : null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      lines: invoice.lines.data.map((line) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity,
      })),
    }));

    // Format upcoming invoice
    const formattedUpcoming = upcomingInvoice
      ? {
          amountDue: upcomingInvoice.amount_due,
          currency: upcomingInvoice.currency,
          periodStart: upcomingInvoice.period_start
            ? new Date(upcomingInvoice.period_start * 1000)
            : null,
          periodEnd: upcomingInvoice.period_end
            ? new Date(upcomingInvoice.period_end * 1000)
            : null,
          lines: upcomingInvoice.lines.data.map((line) => ({
            description: line.description,
            amount: line.amount,
            quantity: line.quantity,
          })),
        }
      : null;

    return NextResponse.json({
      invoices: formattedInvoices,
      upcoming: formattedUpcoming,
    });
  } catch (error) {
    log.error("Failed to get invoices", error);
    return NextResponse.json(
      { error: "Failed to get invoices" },
      { status: 500 }
    );
  }
}
