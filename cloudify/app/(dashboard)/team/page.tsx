"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Crown,
  Trash2,
  ChevronDown,
  Search,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTeams } from "@/hooks/use-teams";

type Role = "owner" | "admin" | "member" | "developer" | "viewer";

const roleConfig: Record<string, { label: string; color: string; permissions: string[] }> = {
  owner: {
    label: "Owner",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    permissions: ["Full access", "Billing", "Delete team"],
  },
  admin: {
    label: "Admin",
    color: "bg-secondary text-foreground",
    permissions: ["Manage members", "All projects", "Settings"],
  },
  developer: {
    label: "Developer",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    permissions: ["Deploy", "View logs", "Environment vars"],
  },
  member: {
    label: "Member",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    permissions: ["View projects", "View deployments"],
  },
  viewer: {
    label: "Viewer",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    permissions: ["View projects", "View deployments"],
  },
};

export default function TeamPage() {
  const { teams, loading, error, inviteMember, removeMember, refetch } = useTeams();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("developer");
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Get the first team (personal workspace) or all members across teams
  const currentTeam = teams[0];
  const members = currentTeam?.members || [];

  const filteredMembers = members.filter(
    (member) =>
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inviteLink = currentTeam && typeof window !== "undefined"
    ? `${window.location.origin}/invitations/${currentTeam.id}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    if (!currentTeam || !inviteEmail) return;

    setIsInviting(true);
    setInviteError(null);

    try {
      await inviteMember(currentTeam.id, inviteEmail, inviteRole);
      setInviteDialogOpen(false);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] = useState<{ userId: string; name: string; currentRole: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("member");
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleChangeRole = async () => {
    if (!currentTeam || !roleDialogMember) return;
    setIsChangingRole(true);
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: roleDialogMember.userId, role: selectedRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to change role");
      } else {
        await refetch();
        setRoleDialogOpen(false);
      }
    } catch {
      alert("Network error");
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentTeam) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember(currentTeam.id, userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to load team
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Team Members
          </h1>
          <p className="text-muted-foreground">
            Manage your team and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="default" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: members.length, icon: Users },
          {
            label: "Admins",
            value: members.filter((m) => m.role === "admin" || m.role === "owner").length,
            icon: Shield,
          },
          {
            label: "Developers",
            value: members.filter((m) => m.role === "developer" || m.role === "member").length,
            icon: Users,
          },
          {
            label: "Projects",
            value: currentTeam?.projectCount || 0,
            icon: Mail,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members list */}
      {members.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No team members yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Invite team members to collaborate on your projects.
          </p>
          <Button variant="default" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Member
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Joined
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => {
                  const role = roleConfig[member.role] || roleConfig.member;

                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border last:border-0 hover:bg-secondary/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatar || undefined} />
                            <AvatarFallback>
                              {member.user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || member.user.email?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground flex items-center gap-2">
                              {member.user.name || "Unknown"}
                              {member.role === "owner" && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            role.color
                          )}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="px-6 py-4">
                        {member.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setRoleDialogMember({
                                    userId: member.user.id,
                                    name: member.user.name || member.user.email || "Member",
                                    currentRole: member.role,
                                  });
                                  setSelectedRole(member.role as Role);
                                  setRoleDialogOpen(true);
                                }}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleRemoveMember(member.user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your team by email or share an invite link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Role
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {roleConfig[inviteRole]?.label || "Member"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {(["admin", "developer", "member"] as Role[]).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setInviteRole(role)}
                    >
                      <div>
                        <p className="font-medium">{roleConfig[role]?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleConfig[role]?.permissions.join(", ")}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {inviteError && (
              <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
            )}

            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground">
                Or share invite link
              </label>
              <div className="flex items-center gap-2 mt-2">
                <Input value={inviteLink} readOnly className="text-sm" />
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleInvite}
              disabled={!inviteEmail || isInviting}
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {roleDialogMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Role
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {roleConfig[selectedRole]?.label || "Member"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {(["admin", "developer", "member", "viewer"] as Role[]).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div>
                        <p className="font-medium">{roleConfig[role]?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleConfig[role]?.permissions.join(", ")}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleChangeRole}
              disabled={isChangingRole || selectedRole === roleDialogMember?.currentRole}
            >
              {isChangingRole ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
