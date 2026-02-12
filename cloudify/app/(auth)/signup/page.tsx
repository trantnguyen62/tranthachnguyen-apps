"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Cloud, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateName(name: string): string | null {
  if (!name.trim()) return null;
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.trim().length > 100) return "Name must be 100 characters or less";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return null;
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

// ---------------------------------------------------------------------------
// Password strength - continuous bar
// ---------------------------------------------------------------------------

type PasswordStrength = "none" | "weak" | "fair" | "good" | "strong";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getPasswordStrength(password: string): { level: PasswordStrength; percentage: number } {
  if (!password) return { level: "none", percentage: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak", percentage: 25 };
  if (score === 2) return { level: "fair", percentage: 50 };
  if (score === 3) return { level: "good", percentage: 75 };
  return { level: "strong", percentage: 100 };
}

function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

const strengthColors: Record<PasswordStrength, string> = {
  none: "bg-muted",
  weak: "bg-[var(--error,#FF3B30)]",
  fair: "bg-[var(--warning,#FF9F0A)]",
  good: "bg-[#A8D08D]",
  strong: "bg-[var(--success,#34C759)]",
};

const strengthTextColors: Record<PasswordStrength, string> = {
  none: "",
  weak: "text-[var(--error,#FF3B30)]",
  fair: "text-[var(--warning,#FF9F0A)]",
  good: "text-[#A8D08D]",
  strong: "text-[var(--success,#34C759)]",
};

const strengthLabels: Record<PasswordStrength, string> = {
  none: "",
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

// ---------------------------------------------------------------------------
// Accessible field error
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
// Signup page - Apple style
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean }>({
    name: false,
    email: false,
    password: false,
  });

  const handleBlur = useCallback((field: "name" | "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const nameError = touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, email: true, password: true });

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (nameErr || emailErr || passwordErr) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        window.location.href = "/login";
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary,theme(colors.background))] px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
              <Cloud className="h-5 w-5 text-background" />
            </div>
          </Link>
          <h1 className="mt-6 text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            Create your account
          </h1>
          <p className="mt-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Start deploying in seconds
          </p>
        </div>

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
              htmlFor="name"
              className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]"
            >
              Full name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`h-11 ${nameError ? "border-[var(--error,#FF3B30)]" : ""}`}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
              required
              autoComplete="name"
            />
            <FieldError id="name-error" message={nameError} />
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
              aria-describedby={emailError ? "signup-email-error" : undefined}
              required
              autoComplete="email"
            />
            <FieldError id="signup-email-error" message={emailError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`h-11 pr-10 ${passwordError ? "border-[var(--error,#FF3B30)]" : ""}`}
                aria-invalid={!!passwordError}
                aria-describedby="password-hint signup-password-error"
                required
                autoComplete="new-password"
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
            <FieldError id="signup-password-error" message={passwordError} />

            {/* Password strength - single continuous bar */}
            {password.length > 0 && (
              <div className="mt-2 space-y-2">
                {/* Continuous strength bar */}
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColors[passwordStrength.level]}`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <p className={`text-[13px] ${strengthTextColors[passwordStrength.level]}`} id="password-hint">
                  {strengthLabels[passwordStrength.level]}
                </p>

                {/* Requirements checklist */}
                <div className="grid grid-cols-2 gap-1.5">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5 text-[13px]">
                      <Check
                        className={`h-3 w-3 shrink-0 ${
                          req.met
                            ? "text-[var(--success,#34C759)]"
                            : "text-[var(--text-quaternary,theme(colors.muted.foreground/40))]"
                        }`}
                      />
                      <span className={req.met ? "text-[var(--text-secondary,theme(colors.muted.foreground))]" : "text-[var(--text-tertiary,theme(colors.muted.foreground/70))]"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!password && (
              <p className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]" id="password-hint">
                Must be at least 8 characters
              </p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary,theme(colors.border))] text-[var(--accent,#0071E3)] focus:ring-[var(--accent,#0071E3)]"
            />
            <label htmlFor="terms" className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-[var(--accent,#0071E3)] hover:opacity-80">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[var(--accent,#0071E3)] hover:opacity-80">Privacy Policy</Link>
            </label>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-11 text-[15px] font-semibold"
            disabled={isLoading || !agreedToTerms}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Sign in link */}
        <p className="mt-8 text-center text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent,#0071E3)] hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
