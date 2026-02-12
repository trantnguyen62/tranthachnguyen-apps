"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Key,
  Bell,
  Shield,
  CreditCard,
  Users,
  Github,
  Globe,
  Trash2,
  Save,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  accounts?: Array<{ provider: string }>;
  _count: {
    projects: number;
    teamMembers: number;
  };
}

const oauthProviders = [
  { name: "GitHub", icon: Github, provider: "github" },
  { name: "Google", icon: Globe, provider: "google" },
];

// Maps to the notification types from the API
interface NotificationPref {
  id?: string;
  type: string;
  label: string;
  description: string;
  enabled: boolean;
}

const NOTIFICATION_DEFS: Omit<NotificationPref, "enabled" | "id">[] = [
  { type: "deployment_success", label: "Deployment notifications", description: "Get notified when deployments complete" },
  { type: "deployment_failure", label: "Build failures", description: "Get alerted when builds fail" },
  { type: "team_invite", label: "Team invitations", description: "Receive notifications for team invites" },
  { type: "usage_warning", label: "Usage warnings", description: "Get alerted when approaching plan limits" },
  { type: "security_alert", label: "Security alerts", description: "Critical security notifications" },
];

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "success"
          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {type === "success" ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifications, setNotifications] = useState<NotificationPref[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Billing state
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  // Team invite state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; user: { name: string; email: string; avatar?: string }; role: string }>>([]);

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

  // Fetch notification preferences from API
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
            enabled: saved ? saved.enabled : def.type !== "usage_warning", // Default most to true
          };
        });
        setNotifications(prefs);
      } else {
        // Fallback to defaults
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

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        setProfileMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileMessage(null), 4000);
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
      setPasswordMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setPasswordMessage(null), 4000);
    }
  };

  // Toggle notification preference via API
  const toggleNotification = async (index: number) => {
    const pref = notifications[index];
    const newEnabled = !pref.enabled;

    // Optimistic update
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
      // Revert on error
      const reverted = [...notifications];
      reverted[index] = pref;
      setNotifications(reverted);
    }
  };

  // Billing: Upgrade to Pro via Stripe Checkout
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
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBillingLoading(null);
    }
  };

  // Billing: Open Stripe Portal
  const handleManageBilling = async () => {
    setBillingLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open billing portal");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBillingLoading(null);
    }
  };

  // Delete account
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
          // signOut may throw if the session is already cleared — redirect manually
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

  // Connect OAuth provider
  const handleConnectProvider = (provider: string) => {
    signIn(provider, { callbackUrl: "/settings" });
  };

  // Team invite
  const handleInviteTeamMember = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    setInviteMessage(null);
    try {
      // Get user's first team (or create one)
      const teamsRes = await fetch("/api/teams");
      let teamId: string | null = null;
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const teams = Array.isArray(teamsData) ? teamsData : teamsData.teams || [];
        if (teams.length > 0) {
          teamId = teams[0].id;
        }
      }

      if (!teamId) {
        // Create a default team
        const createRes = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `${name || "My"}'s Team` }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          teamId = data.id;
        }
      }

      if (!teamId) {
        setInviteMessage({ type: "error", text: "Failed to find or create team" });
        return;
      }

      const res = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteMessage({ type: "success", text: `Invitation sent to ${inviteEmail}` });
        setInviteEmail("");
        setShowInviteDialog(false);
      } else {
        setInviteMessage({ type: "error", text: data.error || "Failed to send invitation" });
      }
    } catch {
      setInviteMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsInviting(false);
      setTimeout(() => setInviteMessage(null), 4000);
    }
  };

  // Fetch team members
  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          const teams = Array.isArray(data) ? data : data.teams || [];
          if (teams.length > 0 && teams[0].members) {
            setTeamMembers(teams[0].members);
          }
        }
      } catch {
        // Ignore
      }
    }
    fetchTeam();
  }, []);

  const userInitials = (name || email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = profile?.avatar || profile?.image || session?.user?.image;

  const planPricing: Record<string, string> = {
    free: "$0/month",
    pro: "$20/month",
    team: "$50/month",
    enterprise: "Custom",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          Settings
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-muted-foreground"
        >
          Manage your account settings and preferences.
        </motion.p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileMessage && (
                  <StatusMessage type={profileMessage.type} message={profileMessage.text} />
                )}

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Avatar synced from your connected account.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={email}
                      disabled
                      className="pl-10 opacity-60"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                {profile && (
                  <div className="text-xs text-muted-foreground">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                )}

                <Button variant="default" onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Connect your Git providers to deploy from repositories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {oauthProviders.map((account) => {
                  const isConnected = profile?.accounts?.some(
                    (a) => a.provider === account.provider
                  ) ?? false;
                  return (
                    <div
                      key={account.name}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <account.icon className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">
                            {account.name}
                          </div>
                          {isConnected && (
                            <p className="text-sm text-green-600 dark:text-green-400">Connected</p>
                          )}
                        </div>
                      </div>
                      {isConnected ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnectProvider(account.provider)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordMessage && (
                  <StatusMessage type={passwordMessage.type} message={passwordMessage.text} />
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={handleChangePassword}
                  disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">
                        Authenticator App
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use an authenticator app for 2FA
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all of its data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                      This action is irreversible. All your projects, deployments, domains, and data will be permanently deleted.
                    </p>
                    {deleteError && (
                      <StatusMessage type="error" message={deleteError} />
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-red-700 dark:text-red-400">
                        Enter your password to confirm
                      </label>
                      <Input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || !deletePassword}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Confirm Delete"
                        )}
                      </Button>
                      <Button
                        variant="outline"
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
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive via email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.type}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {notification.label}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        checked={notification.enabled}
                        onCheckedChange={() => toggleNotification(index)}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the {profile?.plan || "Free"} plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div>
                    <div className="text-2xl font-bold capitalize">{profile?.plan || "Free"}</div>
                    <p className="text-background/70">
                      {planPricing[profile?.plan || "free"] || "$0/month"}
                    </p>
                  </div>
                  {(profile?.plan === "free" || !profile?.plan) && (
                    <Button
                      className="bg-background text-[#0070f3] hover:bg-secondary"
                      onClick={() => handleUpgrade("pro", "monthly")}
                      disabled={billingLoading === "pro-monthly"}
                    >
                      {billingLoading === "pro-monthly" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Upgrade to Pro
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-background">
                    <div className="text-2xl font-bold text-foreground">
                      {profile?._count?.projects || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background">
                    <div className="text-2xl font-bold text-foreground">
                      {(() => {
                        const limits = getPlanLimits((profile?.plan || "free") as PlanType);
                        return isUnlimited(limits.bandwidthGB) ? "Unlimited" : `${limits.bandwidthGB}GB`;
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground">Bandwidth</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background">
                    <div className="text-2xl font-bold text-foreground">
                      {(() => {
                        const limits = getPlanLimits((profile?.plan || "free") as PlanType);
                        return isUnlimited(limits.buildMinutesPerMonth) ? "Unlimited" : limits.buildMinutesPerMonth;
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground">Build Minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage Billing</CardTitle>
                <CardDescription>
                  {profile?.stripeCustomerId
                    ? "View invoices, update payment method, or change your plan."
                    : "Add a payment method to upgrade your plan."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.stripeCustomerId ? (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={billingLoading === "portal"}
                  >
                    {billingLoading === "portal" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Manage Billing
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade("pro", "monthly")}
                    disabled={billingLoading === "pro-monthly"}
                  >
                    {billingLoading === "pro-monthly" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Add Payment Method
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inviteMessage && (
                    <StatusMessage type={inviteMessage.type} message={inviteMessage.text} />
                  )}

                  {/* Current user (owner) */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {name || "You"}
                        </div>
                        <p className="text-sm text-muted-foreground">{email}</p>
                      </div>
                    </div>
                    <Badge>Owner</Badge>
                  </div>

                  {/* Other team members */}
                  {teamMembers
                    .filter((m) => m.user.email !== email)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar || undefined} />
                            <AvatarFallback>
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {member.user.name}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">{member.role}</Badge>
                      </div>
                    ))}

                  {/* Invite button or form */}
                  {showInviteDialog ? (
                    <div className="p-4 rounded-lg border border-border bg-secondary/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Invite Team Member</h4>
                        <button
                          onClick={() => setShowInviteDialog(false)}
                          className="text-muted-foreground hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="developer">Developer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <Button
                        variant="default"
                        onClick={handleInviteTeamMember}
                        disabled={isInviting || !inviteEmail}
                        className="w-full"
                      >
                        {isInviting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite Team Member
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
