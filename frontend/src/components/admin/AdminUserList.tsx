"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, updateUserActive, updateUserRole, type AuthUser } from "@/lib/api";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";

export function AdminUserList({ roleFilter, title }: { roleFilter?: Role; title: string }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () =>
    getAdminUsers(roleFilter).then((data) => {
      setUsers(data);
      setIsLoading(false);
    });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const toggleActive = async (u: AuthUser) => {
    await updateUserActive(u.id, !u.is_active);
    refresh();
  };

  const changeRole = async (u: AuthUser, role: Role) => {
    await updateUserRole(u.id, role);
    refresh();
  };

  return (
    <Card>
      <CardHeader title={title} subtitle={isLoading ? "Loading..." : `${users.length} user(s)`} />
      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
          >
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{u.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => changeRole(u, e.target.value as Role)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleActive(u)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  u.is_active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                }`}
              >
                {u.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </li>
        ))}
        {!isLoading && users.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No users found.</p>
        )}
      </ul>
    </Card>
  );
}
