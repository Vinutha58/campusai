"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
  type Company,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Pencil, Trash } from "lucide-react";

const EMPTY_FORM = { name: "", description: "", industry: "", website: "", location: "" };

function PlacementCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => getCompanies().then((data) => {
    setCompanies(data);
    setIsLoading(false);
  });

  useEffect(() => {
    refresh();
  }, []);

  const startEdit = (c: Company) => {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description, industry: c.industry, website: c.website, location: c.location });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCompany(editingId, form);
      } else {
        await createCompany(form);
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the company.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete the company.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Companies" subtitle={isLoading ? "Loading..." : `${companies.length} compan${companies.length === 1 ? "y" : "ies"}`} />
          <ul className="space-y-2">
            {companies.map((c) => (
              <li key={c.id} className="flex items-start justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {c.industry} {c.location && `· ${c.location}`}
                  </p>
                  {c.description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{c.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(c)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-900" aria-label={`Edit ${c.name}`}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label={`Delete ${c.name}`}>
                    <Trash size={15} />
                  </button>
                </div>
              </li>
            ))}
            {!isLoading && companies.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No companies yet — add your first one.</p>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title={editingId ? "Edit Company" : "New Company"} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" required placeholder="Company name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <input type="text" placeholder="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <input type="url" placeholder="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Add company"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900">
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function CompaniesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "placement_officer" || user.role === "admin") return <PlacementCompanies />;
  return <ComingSoon title="Companies" />;
}
