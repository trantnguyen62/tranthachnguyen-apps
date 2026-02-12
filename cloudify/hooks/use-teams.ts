"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  plan: string;
  createdAt: string;
  updatedAt: string;
  myRole: string;
  members: TeamMember[];
  projectCount: number;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async (name: string): Promise<Team> => {
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create team");
    }

    const newTeam = await response.json();
    setTeams((prev) => [{ ...newTeam, myRole: "owner", projectCount: 0 }, ...prev]);
    return newTeam;
  };

  const updateTeam = async (
    teamId: string,
    data: { name?: string; image?: string }
  ): Promise<Team> => {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update team");
    }

    const updated = await response.json();
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...updated } : t))
    );
    return updated;
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete team");
    }

    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const inviteMember = async (
    teamId: string,
    email: string,
    role: string = "member"
  ): Promise<TeamMember> => {
    const response = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to invite member");
    }

    const member = await response.json();
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, members: [...t.members, member] } : t
      )
    );
    return member;
  };

  const removeMember = async (teamId: string, userId: string): Promise<void> => {
    const response = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to remove member");
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.filter((m) => m.user.id !== userId) }
          : t
      )
    );
  };

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    removeMember,
    refetch: fetchTeams,
  };
}
