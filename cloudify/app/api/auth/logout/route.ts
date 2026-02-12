/**
 * POST /api/auth/logout - Sign out by clearing all session cookies
 *
 * Clears both the NextAuth session cookie and the custom cloudify_session cookie,
 * then returns a redirect URL. This is more reliable than NextAuth's client-side
 * signOut() which depends on CSRF token exchange.
 */

import { cookies } from "next/headers";
import { ok } from "@/lib/api/response";

export async function POST() {
  const cookieStore = await cookies();

  // Clear NextAuth session cookies
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  cookieStore.delete("authjs.csrf-token");
  cookieStore.delete("__Host-authjs.csrf-token");
  cookieStore.delete("authjs.callback-url");
  cookieStore.delete("__Secure-authjs.callback-url");

  // Clear custom session cookie
  cookieStore.delete("cloudify_session");

  return ok({ success: true });
}
