"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  createDrive,
  getCompanies,
  getDrives,
  updateDrive,
  type Company,
  type Drive,
  type DriveInput,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Pencil } from "lucide-react";

const EMPTY_FORM: DriveInput = {
  company_id: "",
  job_role: "",
  package: "",
  location: "",
  eligibility: { min_cgpa: 0, branches: [], min_year: 1, max_backlogs: 0 },
  application_deadline: "",
  drive_date: null,
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

function PlacementDrives() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DriveInput>(EMPTY_FORM);
  const [branchesText, setBranchesText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = () => getDrives().then(setDrives);

  useEffect(() => {
    refresh();
    getCompanies().then((data) => {
      setCompanies(data);
      setForm((f) => (f.company_id ? f : { ...f, company_id: data[0]?.id ?? "" }));
    });
  }, []);

  const startEdit = (d: Drive) => {
    setEditingId(d.id);
    setForm({
      company_id: d.company_id,
      job_role: d.job_role,
      package: d.package,
      location: d.location,
      eligibility: d.eligibility,
      application_deadline: toDateInputValue(d.application_deadline),
      drive_date: d.drive_date ? toDateInputValue(d.drive_date) : null,
    });
    setBranchesText(d.eligibility.branches.join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, company_id: companies[0]?.id ?? "" });
    setBranchesText("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.company_id) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: DriveInput = {
        ...form,
        eligibility: {
          ...form.eligibility,
          branches: branchesText.split(",").map((b) => b.trim()).filter(Boolean),
        },
        application_deadline: new Date(form.application_deadline).toISOString(),
        drive_date: form.drive_date ? new Date(form.drive_date).toISOString() : null,
      };
      if (editingId) {
        await updateDrive(editingId, payload);
      } else {
        await createDrive(payload);
      }
      cancelEdit();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the drive.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Add a company first before creating a drive.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Placement Drives" />
          <ul className="space-y-2">
            {drives.map((d) => (
              <li key={d.id} className="flex items-start justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {d.company_name} — {d.job_role}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {d.package} · {d.location} · Deadline {toDateInputValue(d.application_deadline)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Min CGPA {d.eligibility.min_cgpa} · Year {d.eligibility.min_year}+ · Backlogs ≤{d.eligibility.max_backlogs}
                    {d.eligibility.branches.length > 0 && ` · ${d.eligibility.branches.join(", ")}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${d.is_open ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                    {d.is_open ? "Open" : "Closed"}
                  </span>
                  <button onClick={() => startEdit(d)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-900" aria-label={`Edit ${d.job_role}`}>
                    <Pencil size={15} />
                  </button>
                </div>
              </li>
            ))}
            {drives.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No drives yet.</p>}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title={editingId ? "Edit Drive" : "New Drive"} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select value={form.company_id} onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="text" required placeholder="Job role" value={form.job_role} onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <div className="flex gap-2">
            <input type="text" placeholder="Package (e.g. 10 LPA)" value={form.package} onChange={(e) => setForm((f) => ({ ...f, package: e.target.value }))} className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
            <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          </div>

          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Eligibility</p>
          <div className="flex gap-2">
            <input type="number" step="0.1" min={0} max={10} placeholder="Min CGPA" value={form.eligibility.min_cgpa} onChange={(e) => setForm((f) => ({ ...f, eligibility: { ...f.eligibility, min_cgpa: Number(e.target.value) } }))} className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
            <input type="number" min={1} max={5} placeholder="Min year" value={form.eligibility.min_year} onChange={(e) => setForm((f) => ({ ...f, eligibility: { ...f.eligibility, min_year: Number(e.target.value) } }))} className="w-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          </div>
          <input type="number" min={0} placeholder="Max backlogs allowed" value={form.eligibility.max_backlogs} onChange={(e) => setForm((f) => ({ ...f, eligibility: { ...f.eligibility, max_backlogs: Number(e.target.value) } }))} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
          <input type="text" placeholder="Eligible branches (comma-separated)" value={branchesText} onChange={(e) => setBranchesText(e.target.value)} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />

          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Dates</p>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Application deadline</label>
              <input type="date" required value={form.application_deadline} onChange={(e) => setForm((f) => ({ ...f, application_deadline: e.target.value }))} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="w-1/2">
              <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Drive date (optional)</label>
              <input type="date" value={form.drive_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, drive_date: e.target.value || null }))} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? "Saving..." : editingId ? "Save changes" : "Create drive"}
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

export default function DrivesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "placement_officer" || user.role === "admin") return <PlacementDrives />;
  return <ComingSoon title="Placement Drives" />;
}
