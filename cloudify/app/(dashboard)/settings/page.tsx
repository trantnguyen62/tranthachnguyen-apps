"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getPlanLimits, isUnlimited, type PlanType } from "@/lib/billing/pricing";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  image: string | null;
  plan: string;
  createdAt: string;
  stripeCustomerId?: string | null;
  _count: {
    projects: number;
    teamMembers: number;
  };
}

interface NotificationPref {
  id?: string;
  type: string;
  label: string;
  description: string;
  category: string;
  enabled: boolean;
}

const NOTIFICATION_DEFS: Omit<NotificationPref, "enabled" | "id">[] = [
  { type: "deployment_success", label: "Successful deployments", description: "Get notified when deployments complete", category: "Deployments" },
  { type: "deployment_failure", label: "Build failures", description: "Get alerted when builds fail", category: "Deployments" },
  { type: "team_invite", label: "Team invitations", description: "Receive notifications for team invites", category: "Team" },
  { type: "usage_warning", label: "Usage warnings", description: "Get alerted when approaching plan limits", category: "System" },
  { type: "security_alert", label: "Security alerts", description: "Critical security notifications", category: "Security" },
];

const NAV_ITEMS = [
  { id: "general", label: "General" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-[13px]",
        type === "success"
          ? "bg-[var(--success-subtle,theme(colors.green.50))] text-[var(--success,#34C759)]"
          : "bg-[var(--error-subtle,theme(colors.red.50))] text-[var(--error,#FF3B30)]"
      )}
    >
      {type === "success" ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      )}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("general");

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<NotificationPref[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Billing
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setName(data.user.name || "");
          setEmail(data.user.email || "");
        }
      } catch {
        if (session?.user) {
          setName(session.user.name || "");
          setEmail(session.user.email || "");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [session]);

  // Fetch notification preferences
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        const prefs: NotificationPref[] = NOTIFICATION_DEFS.map((def) => {
          const saved = data.preferences?.find(
            (p: { type: string; enabled: boolean; id: string }) => p.type === def.type && p.enabled
          );
          return {
            ...def,
            id: saved?.id,
            enabled: saved ? saved.enabled : def.type !== "usage_warning",
          };
        });
        setNotifications(prefs);
      } else {
        setNotifications(NOTIFICATION_DEFS.map((d) => ({ ...d, enabled: true })));
      }
    } catch {
      setNotifications(NOTIFICATION_DEFS.map((d) => ({ ...d, enabled: true })));
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Save name inline (on blur or Enter)
  const handleSaveName = async () => {
    if (name === (profile?.name || "")) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      } else {
        setProfileMessage({ type: "error", text: data.error || "Failed to update name" });
        setTimeout(() => setProfileMessage(null), 4000);
      }
    } catch {
      setProfileMessage({ type: "error", text: "Network error" });
      setTimeout(() => setProfileMessage(null), 4000);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setIsSavingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Network error" });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setPasswordMessage(null), 4000);
    }
  };

  const toggleNotification = async (index: number) => {
    const pref = notifications[index];
    const newEnabled = !pref.enabled;

    const updated = [...notifications];
    updated[index] = { ...pref, enabled: newEnabled };
    setNotifications(updated);

    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pref.type,
          channel: "email",
          enabled: newEnabled,
        }),
      });
    } catch {
      const reverted = [...notifications];
      reverted[index] = pref;
      setNotifications(reverted);
    }
  };

  const handleUpgrade = async (plan: string, interval: string) => {
    setBillingLoading(`${plan}-${interval}`);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silent
    } finally {
      setBillingLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silent
    } finally {
      setBillingLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        try {
          await signOut({ callbackUrl: "/" });
        } catch {
          window.location.href = "/";
        }
        return;
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const userInitials = (name || email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = profile?.image || session?.user?.image;

  const planPricing: Record<string, string> = {
    free: "$0/month",
    pro: "$20/month",
    team: "$50/month",
    enterprise: "Custom",
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <Skeleton className="h-7 w-32 mb-8" />
        <div className="flex gap-12">
          <div className="w-[200px] space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="flex-1 space-y-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Group notifications by category
  const notifCategories = notifications.reduce<Record<string, NotificationPref[]>>((acc, n) => {
    if (!acc[n.category]) acc[n.category] = [];
    acc[n.category].push(n);
    return acc;
  }, {});

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Page title */}
      <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))] mb-8">
        Settings
      </h1>

      {/* Two-column layout: left nav + content */}
      <div className="flex gap-12">
        {/* Left navigation */}
        <nav className="w-[200px] shrink-0">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-[15px] transition-colors",
                  activeSection === item.id
                    ? "bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] text-[var(--text-primary,theme(colors.foreground))] font-medium"
                    : "text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT/50))]"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Separator + Danger Zone */}
          <div className="border-t border-[var(--separator,theme(colors.border))] mt-3 pt-3">
            <button
              onClick={() => setActiveSection("danger")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-[15px] transition-colors",
                activeSection === "danger"
                  ? "bg-[var(--error-subtle,theme(colors.red.50))] text-[var(--error,#FF3B30)] font-medium"
                  : "text-[var(--error,#FF3B30)] hover:bg-[var(--error-subtle,theme(colors.red.50))]"
              )}
            >
              Danger Zone
            </button>
          </div>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* General Section */}
          {activeSection === "general" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-6">
                  General
                </h2>

                {profileMessage && (
                  <div className="mb-4">
                    <StatusMessage type={profileMessage.type} message={profileMessage.text} />
                  </div>
                )}

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-8">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                      {name || "Your Name"}
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Name field - inline save */}
                <div className="space-y-2 mb-6">
                  <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                    Display Name
                  </label>
                  <div className="relative max-w-[400px]">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      placeholder="Your name"
                      className="h-10 pr-8"
                    />
                    {isSavingName && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-[var(--text-tertiary,theme(colors.muted.foreground/70))]" />
                    )}
                    {nameSaved && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--success,#34C759)]" />
                    )}
                  </div>
                </div>

                {/* Email field - read only */}
                <div className="space-y-2 mb-6">
                  <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                    Email
                  </label>
                  <Input
                    value={email}
                    disabled
                    className="h-10 max-w-[400px] opacity-60"
                  />
                  <p className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                {profile && (
                  <p className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-6">
                  Security
                </h2>

                {/* Change password */}
                <div className="mb-8">
                  <h3 className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] mb-4">
                    Change Password
                  </h3>

                  {passwordMessage && (
                    <div className="mb-4 max-w-[400px]">
                      <StatusMessage type={passwordMessage.type} message={passwordMessage.text} />
                    </div>
                  )}

                  <div className="space-y-3 max-w-[400px]">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        className="h-11"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                        New Password
                      </label>
                      <Input
                        type="password"
                        className="h-11"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        className="h-11"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="mt-2"
                    >
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && (
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-6">
                Notifications
              </h2>

              {notifLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(notifCategories).map(([category, prefs]) => (
                    <div key={category}>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] mb-3">
                        {category}
                      </h3>
                      <div className="space-y-0">
                        {prefs.map((pref) => {
                          const globalIndex = notifications.findIndex((n) => n.type === pref.type);
                          return (
                            <div
                              key={pref.type}
                              className="flex items-center justify-between py-3 border-b border-[var(--separator,theme(colors.border))]"
                            >
                              <div>
                                <p className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                                  {pref.label}
                                </p>
                                <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                                  {pref.description}
                                </p>
                              </div>
                              <Switch
                                checked={pref.enabled}
                                onCheckedChange={() => toggleNotification(globalIndex)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billing Section */}
          {activeSection === "billing" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-6">
                  Billing
                </h2>

                {/* Current plan */}
                <div className="mb-8">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-1">
                        Current Plan
                      </p>
                      <p className="text-[24px] font-semibold text-[var(--text-primary,theme(colors.foreground))] capitalize">
                        {profile?.plan || "Free"}
                      </p>
                      <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                        {planPricing[profile?.plan || "free"] || "$0/month"}
                      </p>
                    </div>
                    {(profile?.plan === "free" || !profile?.plan) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpgrade("pro", "monthly")}
                        disabled={billingLoading === "pro-monthly"}
                      >
                        {billingLoading === "pro-monthly" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Upgrade to Pro"
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Usage stats */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[24px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
                        {profile?._count?.projects || 0}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                        Projects
                      </p>
                    </div>
                    <div>
                      <p className="text-[24px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
                        {(() => {
                          const limits = getPlanLimits((profile?.plan || "free") as PlanType);
                          return isUnlimited(limits.bandwidthGB) ? "Unlimited" : `${limits.bandwidthGB}GB`;
                        })()}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                        Bandwidth
                      </p>
                    </div>
                    <div>
                      <p className="text-[24px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
                        {(() => {
                          const limits = getPlanLimits((profile?.plan || "free") as PlanType);
                          return isUnlimited(limits.buildMinutesPerMonth) ? "Unlimited" : limits.buildMinutesPerMonth;
                        })()}
                      </p>
                      <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                        Build Minutes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manage billing */}
                <div className="border-t border-[var(--separator,theme(colors.border))] pt-6">
                  <h3 className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] mb-2">
                    Payment & Invoices
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-4">
                    {profile?.stripeCustomerId
                      ? "View invoices, update payment method, or change your plan."
                      : "Add a payment method to upgrade your plan."}
                  </p>
                  {profile?.stripeCustomerId ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleManageBilling}
                      disabled={billingLoading === "portal"}
                    >
                      {billingLoading === "portal" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          Manage Billing
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpgrade("pro", "monthly")}
                      disabled={billingLoading === "pro-monthly"}
                    >
                      {billingLoading === "pro-monthly" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          Add Payment Method
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Section */}
          {activeSection === "danger" && (
            <div>
              <h2 className="text-[17px] font-semibold text-[var(--error,#FF3B30)] mb-6">
                Danger Zone
              </h2>

              <div>
                <h3 className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] mb-2">
                  Delete Account
                </h3>
                <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-4">
                  Permanently delete your account and all of its data. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg border border-[var(--error,#FF3B30)] bg-[var(--error-subtle,theme(colors.red.50))] max-w-[400px]">
                    <p className="text-[13px] text-[var(--error,#FF3B30)] font-medium">
                      All your projects, deployments, domains, and data will be permanently deleted.
                    </p>
                    {deleteError && (
                      <StatusMessage type="error" message={deleteError} />
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[var(--error,#FF3B30)]">
                        Enter your password to confirm
                      </label>
                      <Input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                        className="h-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || !deletePassword}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Confirm Delete"
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
