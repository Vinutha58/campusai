"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { NOTIFICATION_ICONS } from "@/components/notifications/icons";
import { Bell } from "lucide-react";

function formatWhen(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const visible = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const handleSelect = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setNotifications((list) => list.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((list) => list.map((item) => ({ ...item, is_read: true })));
  };

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading notifications...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-zinc-100 p-0 dark:divide-zinc-800">
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Bell size={28} className="text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          </div>
        )}
        {visible.map((n) => {
          const Icon = NOTIFICATION_ICONS[n.type];
          return (
            <button
              key={n.id}
              onClick={() => handleSelect(n)}
              className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
                !n.is_read ? "bg-indigo-50/40 dark:bg-indigo-500/5" : ""
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{n.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{n.body}</p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{formatWhen(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
            </button>
          );
        })}
      </Card>
    </div>
  );
}
