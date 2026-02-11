import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/notifications/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloudify - The Cloud Platform for Developers",
  description:
    "Build, deploy, and scale modern web applications with Cloudify. Git-based deployments, serverless functions, and a global edge network.",
  keywords: [
    "cloud platform",
    "deployment",
    "serverless",
    "edge network",
    "hosting",
    "nextjs",
    "react",
    "vercel alternative",
  ],
  authors: [{ name: "Cloudify Team" }],
  openGraph: {
    title: "Cloudify - The Cloud Platform for Developers",
    description:
      "Build, deploy, and scale modern web applications with Cloudify.",
    url: "https://cloudify.tranthachnguyen.com",
    siteName: "Cloudify",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloudify - The Cloud Platform for Developers",
    description:
      "Build, deploy, and scale modern web applications with Cloudify.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <ToastProvider>{children}</ToastProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
