import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { PageWrapper } from "@/components/layout/PageWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cloudify Documentation",
  description: "Documentation for Cloudify - Deploy your applications with ease",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          <div className="min-h-screen bg-background transition-colors duration-base">
            <Sidebar />
            <main className="lg:pl-sidebar">
              <div className="max-w-5xl mx-auto px-6 py-12 lg:px-8">
                <PageWrapper>
                  {children}
                </PageWrapper>
              </div>
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
