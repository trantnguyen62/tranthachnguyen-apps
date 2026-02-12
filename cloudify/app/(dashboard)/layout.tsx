import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { DeployFaviconProvider } from "@/components/dashboard/deploy-favicon-provider";
import { OnboardingRedirect } from "@/components/onboarding/onboarding-redirect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--surface-primary,theme(colors.background))]">
      {/* Onboarding redirect check (client-side) */}
      <OnboardingRedirect />

      {/* Deploy status favicon */}
      <DeployFaviconProvider />

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Mobile navigation */}
      <MobileNav />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto pb-[83px] lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
