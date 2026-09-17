"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { followUser, getProfile, unfollowUser, type Profile } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { ArrowLeft, Users } from "lucide-react";

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileView({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = () => getProfile(userId).then(setProfile);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    if (profile.is_following) {
      await unfollowUser(profile.id);
    } else {
      await followUser(profile.id);
    }
    refresh();
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/network" className="mb-4 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
        <ArrowLeft size={14} /> Back to Campus Network
      </Link>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {profile.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{profile.name}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{profile.role.replace("_", " ")}</p>
            </div>
          </div>
          {!profile.is_me && (
            <button
              onClick={handleFollowToggle}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                profile.is_following
                  ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {profile.is_following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Users size={14} /> {profile.followers_count} followers
          </span>
          <span>{profile.following_count} following</span>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{profile.bio}</p>}

        <div className="mt-5 flex flex-col gap-4">
          <TagList label="Skills" items={profile.skills} />
          <TagList label="Certifications" items={profile.certifications} />
          <TagList label="Achievements" items={profile.achievements} />
        </div>

        {!profile.bio && profile.skills.length === 0 && profile.certifications.length === 0 && profile.achievements.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">This person hasn&apos;t filled out their profile yet.</p>
        )}
      </Card>
    </div>
  );
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student" || user.role === "admin") {
    return <ProfileView userId={userId} />;
  }
  return <ComingSoon title="Profile" />;
}
