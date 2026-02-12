import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cloudify.tranthachnguyen.com"),
  title: {
    default: "Cloudify - The Cloud Platform for Developers",
    template: "%s | Cloudify",
  },
  description:
    "Deploy, scale, and manage modern web apps with Cloudify. Self-hosted Vercel alternative with Git-based deployments, serverless functions, and edge network.",
  keywords: [
    "cloud platform",
    "deployment",
    "serverless",
    "edge network",
    "hosting",
    "nextjs",
    "react",
    "vercel alternative",
    "self-hosted",
    "open source",
    "docker",
    "kubernetes",
  ],
  authors: [{ name: "Cloudify Team" }],
  creator: "Cloudify",
  publisher: "Cloudify",
  openGraph: {
    title: "Cloudify - The Cloud Platform for Developers",
    description:
      "Deploy, scale, and manage modern web apps with Cloudify. Self-hosted Vercel alternative with Git deployments, serverless functions, and edge network.",
    url: "https://cloudify.tranthachnguyen.com",
    siteName: "Cloudify",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og?title=Cloudify&description=The+Cloud+Platform+for+Developers",
        width: 1200,
        height: 630,
        alt: "Cloudify - The Cloud Platform for Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloudify - The Cloud Platform for Developers",
    description:
      "Deploy, scale, and manage modern web apps with Cloudify. Self-hosted Vercel alternative with Git deployments, serverless functions, and edge network.",
    images: ["/api/og?title=Cloudify&description=The+Cloud+Platform+for+Developers"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </head>
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
