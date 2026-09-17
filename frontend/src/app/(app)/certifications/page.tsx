"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getMyProfile, updateMyProfile, type Profile } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { TagListInput } from "@/components/ui/TagListInput";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Award } from "lucide-react";

function CertificationsContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile().then((data) => {
      setProfile(data);
      setCertifications(data.certifications);
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
        skills: profile.skills,
        certifications,
        achievements: profile.achievements,
      });
      setProfile(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your certifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Award size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Certifications</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Shown on your Campus Network profile</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Your certifications" subtitle="Completed courses, credentials, and badges" />
        {profile && (
          <div className="flex flex-col gap-4">
            <TagListInput
              label="Certifications"
              values={certifications}
              onChange={setCertifications}
              placeholder="AWS Cloud Practitioner"
            />
            <div className="flex flex-wrap gap-2">
              {certifications.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                >
                  {c}
                </span>
              ))}
              {certifications.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No certifications added yet.</p>
              )}
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save certifications"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function CertificationsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <CertificationsContent />;
  return <ComingSoon title="Certifications" />;
}
