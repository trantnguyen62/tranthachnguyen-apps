"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cloud, Github, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard after successful login
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20rem] left-1/2 -translate-x-1/2">
          <div className="h-[40rem] w-[40rem] rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Cloudify
            </span>
          </Link>
        </div>

        <Card className="border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              >
                <Github className="h-5 w-5" />
                Continue with GitHub
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}
