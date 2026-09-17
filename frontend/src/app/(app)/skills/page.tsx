"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getMyProfile, updateMyProfile, type Profile } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { TagListInput } from "@/components/ui/TagListInput";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Sparkles } from "lucide-react";

function SkillsContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile().then((data) => {
      setProfile(data);
      setSkills(data.skills);
    });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const updated = await updateMyProfile({
        bio: profile.bio,
        skills,
        certifications: profile.certifications,
        achievements: profile.achievements,
      });
      setProfile(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your skills.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Sparkles size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Skills</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Shown on your Campus Network profile</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Your skills" subtitle="These help placement officers and peers find your strengths" />
        {profile && (
          <div className="flex flex-col gap-4">
            <TagListInput label="Skills" values={skills} onChange={setSkills} placeholder="Python, React, SQL" />
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                >
                  {s}
                </span>
              ))}
              {skills.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No skills added yet.</p>}
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save skills"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SkillsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <SkillsContent />;
  return <ComingSoon title="Skills" />;
}
