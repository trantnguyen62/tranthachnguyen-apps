"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check, X, Loader2, AlertCircle } from "lucide-react";

interface InvitationData {
  email: string;
  role: string;
  team: {
    name: string;
    slug: string;
    avatar?: string;
  };
  inviter: {
    name: string;
  };
  expiresAt: string;
}

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load invitation");
          return;
        }

        setInvitation(data.invitation);
      } catch (err) {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login with return URL
          router.push(`/login?redirect=/invitations/${token}`);
          return;
        }
        setError(data.error || "Failed to accept invitation");
        return;
      }

      // Redirect to team dashboard
      router.push(`/dashboard/team?joined=${data.team.slug}`);
    } catch (err) {
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to decline invitation");
        return;
      }

      // Redirect to home
      router.push("/?declined=true");
    } catch (err) {
      setError("Failed to decline invitation");
    } finally {
      setDeclining(false);
    }
  }

  function getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      owner: "Owner",
      admin: "Admin",
      member: "Member",
      developer: "Developer",
      viewer: "Viewer",
    };
    return roles[role] || "Member";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            {invitation.team.avatar ? (
              <img
                src={invitation.team.avatar}
                alt={invitation.team.name}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <CardTitle className="text-xl">You're Invited!</CardTitle>
          <CardDescription className="text-base mt-2">
            <strong>{invitation.inviter.name}</strong> has invited you to join{" "}
            <strong>{invitation.team.name}</strong> as a{" "}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
              {getRoleLabel(invitation.role)}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400">Invited email</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Expires</span>
              <span className="font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={declining || accepting}
          >
            {declining ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Decline
          </Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            {accepting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
