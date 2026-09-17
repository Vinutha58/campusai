"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  getMyResume,
  reviewMyResume,
  updateMyResume,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type ResumeLinks,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { FileText, Plus, Sparkles, Trash, TriangleAlert } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function SectionCard({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <button
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            <Plus size={13} /> Add
          </button>
        }
      />
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}

function EntryRow({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <div className="relative rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
      <button
        onClick={onRemove}
        aria-label="Remove entry"
        className="absolute right-2 top-2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
      >
        <Trash size={13} />
      </button>
      <div className="grid grid-cols-1 gap-3 pr-6 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function ResumeContent() {
  const [summary, setSummary] = useState("");
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [links, setLinks] = useState<ResumeLinks>({ github: "", linkedin: "", portfolio: "" });
  const [loaded, setLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);

  useEffect(() => {
    getMyResume()
      .then((data) => {
        setSummary(data.summary);
        setEducation(data.education);
        setExperience(data.experience);
        setProjects(data.projects);
        setLinks(data.links);
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await updateMyResume({ summary, education, experience, projects, links });
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your resume.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async () => {
    setReviewError(null);
    setReview(null);
    setReviewing(true);
    try {
      const res = await reviewMyResume();
      setReview(res.feedback);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Couldn't get a review right now.");
    } finally {
      setReviewing(false);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading resume...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Resume</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Build your resume content here</p>
          </div>
        </div>
        <button
          onClick={handleReview}
          disabled={reviewing}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          <Sparkles size={14} /> {reviewing ? "Reviewing..." : "Get AI review"}
        </button>
      </div>

      {reviewError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>{reviewError}</p>
        </div>
      )}
      {review && (
        <Card>
          <CardHeader title="AI feedback" />
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{review}</p>
        </Card>
      )}

      <Card>
        <CardHeader title="Summary" />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          placeholder="A short professional summary about yourself"
          className={inputClass}
        />
      </Card>

      <SectionCard
        title="Education"
        onAdd={() =>
          setEducation((e) => [...e, { institution: "", degree: "", field: "", start_year: "", end_year: "" }])
        }
      >
        {education.map((entry, i) => (
          <EntryRow key={i} onRemove={() => setEducation((e) => e.filter((_, idx) => idx !== i))}>
            <Field
              label="Institution"
              value={entry.institution}
              onChange={(v) => setEducation((e) => e.map((x, idx) => (idx === i ? { ...x, institution: v } : x)))}
            />
            <Field
              label="Degree"
              value={entry.degree}
              onChange={(v) => setEducation((e) => e.map((x, idx) => (idx === i ? { ...x, degree: v } : x)))}
            />
            <Field
              label="Field of study"
              value={entry.field}
              onChange={(v) => setEducation((e) => e.map((x, idx) => (idx === i ? { ...x, field: v } : x)))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Start year"
                value={entry.start_year}
                onChange={(v) => setEducation((e) => e.map((x, idx) => (idx === i ? { ...x, start_year: v } : x)))}
              />
              <Field
                label="End year"
                value={entry.end_year}
                onChange={(v) => setEducation((e) => e.map((x, idx) => (idx === i ? { ...x, end_year: v } : x)))}
              />
            </div>
          </EntryRow>
        ))}
        {education.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No education added yet.</p>}
      </SectionCard>

      <SectionCard
        title="Experience"
        onAdd={() =>
          setExperience((e) => [
            ...e,
            { title: "", organization: "", start_date: "", end_date: "", description: "" },
          ])
        }
      >
        {experience.map((entry, i) => (
          <EntryRow key={i} onRemove={() => setExperience((e) => e.filter((_, idx) => idx !== i))}>
            <Field
              label="Title"
              value={entry.title}
              onChange={(v) => setExperience((e) => e.map((x, idx) => (idx === i ? { ...x, title: v } : x)))}
            />
            <Field
              label="Organization"
              value={entry.organization}
              onChange={(v) => setExperience((e) => e.map((x, idx) => (idx === i ? { ...x, organization: v } : x)))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Start"
                value={entry.start_date}
                onChange={(v) => setExperience((e) => e.map((x, idx) => (idx === i ? { ...x, start_date: v } : x)))}
              />
              <Field
                label="End"
                value={entry.end_date}
                onChange={(v) => setExperience((e) => e.map((x, idx) => (idx === i ? { ...x, end_date: v } : x)))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  setExperience((exp) => exp.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))
                }
                rows={2}
                className={inputClass}
              />
            </div>
          </EntryRow>
        ))}
        {experience.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No experience added yet.</p>}
      </SectionCard>

      <SectionCard
        title="Projects"
        onAdd={() => setProjects((p) => [...p, { title: "", description: "", tech: [], link: "" }])}
      >
        {projects.map((entry, i) => (
          <EntryRow key={i} onRemove={() => setProjects((p) => p.filter((_, idx) => idx !== i))}>
            <Field
              label="Title"
              value={entry.title}
              onChange={(v) => setProjects((p) => p.map((x, idx) => (idx === i ? { ...x, title: v } : x)))}
            />
            <Field
              label="Link"
              value={entry.link}
              onChange={(v) => setProjects((p) => p.map((x, idx) => (idx === i ? { ...x, link: v } : x)))}
            />
            <Field
              label="Tech (comma-separated)"
              value={entry.tech.join(", ")}
              onChange={(v) =>
                setProjects((p) =>
                  p.map((x, idx) =>
                    idx === i ? { ...x, tech: v.split(",").map((t) => t.trim()).filter(Boolean) } : x
                  )
                )
              }
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Description</label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  setProjects((p) => p.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))
                }
                rows={2}
                className={inputClass}
              />
            </div>
          </EntryRow>
        ))}
        {projects.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No projects added yet.</p>}
      </SectionCard>

      <Card>
        <CardHeader title="Links" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="GitHub" value={links.github} onChange={(v) => setLinks((l) => ({ ...l, github: v }))} />
          <Field label="LinkedIn" value={links.linkedin} onChange={(v) => setLinks((l) => ({ ...l, linkedin: v }))} />
          <Field label="Portfolio" value={links.portfolio} onChange={(v) => setLinks((l) => ({ ...l, portfolio: v }))} />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save resume"}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      </div>
    </div>
  );
}

export default function ResumePage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <ResumeContent />;
  return <ComingSoon title="Resume" />;
}
