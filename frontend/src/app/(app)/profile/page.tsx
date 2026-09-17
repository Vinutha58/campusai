"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, getMyProfile, updateMyProfile, type Profile } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Users } from "lucide-react";

// Only ever mounted once `profile` has loaded (see ProfilePage below), so the
// initial value below is always the real data — no need to re-sync via an effect.
function TagListInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState(values.join(", "));

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <p className="mt-1 text-xs text-zinc-400">Comma-separated</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getMyProfile().then((data) => {
      setProfile(data);
      setBio(data.bio);
      setSkills(data.skills);
      setCertifications(data.certifications);
      setAchievements(data.achievements);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const updated = await updateMyProfile({ bio, skills, certifications, achievements });
      setProfile(updated);
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <h1 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{ROLE_LABELS[user.role]}</p>

          {profile && (
            <div className="mt-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Users size={14} /> {profile.followers_count} followers
              </span>
              <span>{profile.following_count} following</span>
            </div>
          )}
        </div>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Edit Profile" subtitle="Shown on your Campus Network profile" />
          {profile && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="A short line about yourself"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <TagListInput label="Skills" values={skills} onChange={setSkills} placeholder="Python, React, SQL" />
              <TagListInput
                label="Certifications"
                values={certifications}
                onChange={setCertifications}
                placeholder="AWS Cloud Practitioner"
              />
              <TagListInput
                label="Achievements"
                values={achievements}
                onChange={setAchievements}
                placeholder="Winner, college hackathon 2026"
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
