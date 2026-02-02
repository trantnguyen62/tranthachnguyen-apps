"use client";

import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationPreference {
  id: string;
  channel: string;
  type: string;
  enabled: boolean;
  destination: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationIds: string[]) => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) throw new Error("Failed to mark as read");

    setNotifications((prev) =>
      prev.map((n) =>
        notificationIds.includes(n.id) ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
  };

  const markAllAsRead = async () => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });

    if (!response.ok) throw new Error("Failed to mark all as read");

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Failed to fetch preferences");
      const data = await response.json();
      setPreferences(data.preferences);
      setAvailableTypes(data.availableTypes);
      setAvailableChannels(data.availableChannels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (
    channel: string,
    type: string,
    enabled: boolean,
    destination?: string
  ) => {
    const response = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, type, enabled, destination }),
    });

    if (!response.ok) throw new Error("Failed to update preference");

    const updated = await response.json();
    setPreferences((prev) => {
      const existing = prev.findIndex(
        (p) => p.channel === channel && p.type === type
      );
      if (existing >= 0) {
        return prev.map((p, i) => (i === existing ? updated : p));
      }
      return [...prev, updated];
    });
    return updated;
  };

  const deletePreference = async (id: string) => {
    const response = await fetch(`/api/notifications/preferences?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete preference");
    setPreferences((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    preferences,
    availableTypes,
    availableChannels,
    loading,
    error,
    updatePreference,
    deletePreference,
    refetch: fetchPreferences,
  };
}
