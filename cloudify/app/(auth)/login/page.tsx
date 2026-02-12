"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Cloud, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, useSession } from "next-auth/react";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateEmail(email: string): string | null {
  if (!email.trim()) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return null;
  if (password.length < 1) return "Password is required";
  return null;
}

// ---------------------------------------------------------------------------
// Field error component (accessible)
// ---------------------------------------------------------------------------

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="text-[13px] text-[var(--error,#FF3B30)] mt-1.5 flex items-center gap-1.5"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Login form - Apple ID style
// ---------------------------------------------------------------------------

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      const redirectTo = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/dashboard";
      router.push(redirectTo);
    }
  }, [session, status, router, searchParams]);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const handleBlur = useCallback((field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ email: true, password: true });

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary,theme(colors.background))] px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
              <Cloud className="h-5 w-5 text-background" />
            </div>
          </Link>
          <h1 className="mt-6 text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            Welcome back
          </h1>
          <p className="mt-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Sign in to your Cloudify account
          </p>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Form-level error */}
          <div aria-live="polite" aria-atomic="true">
            {error && (
              <div className="p-3 rounded-md bg-[var(--error-subtle,theme(colors.destructive/10))] text-[var(--error,#FF3B30)] text-[13px] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={`h-11 ${emailError ? "border-[var(--error,#FF3B30)]" : ""}`}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              required
              autoComplete="email"
            />
            <FieldError id="email-error" message={emailError} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] text-[var(--accent,#0071E3)] hover:opacity-80 transition-opacity"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`h-11 pr-10 ${passwordError ? "border-[var(--error,#FF3B30)]" : ""}`}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError id="password-error" message={passwordError} />
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-11 text-[15px] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Sign up link */}
        <p className="mt-8 text-center text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[var(--accent,#0071E3)] hover:opacity-80 transition-opacity"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-primary)]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
