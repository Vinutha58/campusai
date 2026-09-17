"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/api";
import { Bell } from "lucide-react";
import { NOTIFICATION_ICONS } from "@/components/notifications/icons";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PANEL_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshCount = () => getUnreadNotificationCount().then((r) => setUnreadCount(r.count));
    refreshCount();
    const interval = setInterval(refreshCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    getNotifications().then((all) => setRecent(all.slice(0, 8)));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const reposition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.right - width),
        window.innerWidth - width - VIEWPORT_MARGIN
      );
      setPanelStyle({ top: rect.bottom + 8, left, width });
    };

    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecent((list) => list.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setRecent((list) => list.map((item) => ({ ...item, is_read: true })));
  };

  const panel = open && panelStyle && (
    <div
      ref={panelRef}
      style={{ position: "fixed", top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
      className="z-50 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {recent.length === 0 && (
          <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No notifications yet.</p>
        )}
        {recent.map((n) => {
          const Icon = NOTIFICATION_ICONS[n.type];
          return (
            <button
              key={n.id}
              onClick={() => handleSelect(n)}
              className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3 text-left last:border-0 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50 ${
                !n.is_read ? "bg-indigo-50/40 dark:bg-indigo-500/5" : ""
              }`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{n.title}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{n.body}</p>
                <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {
          setOpen(false);
          router.push("/notifications");
        }}
        className="block w-full rounded-b-xl border-t border-zinc-100 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-indigo-400 dark:hover:bg-zinc-800/50"
      >
        View all
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {panel && createPortal(panel, document.body)}
    </>
  );
}
