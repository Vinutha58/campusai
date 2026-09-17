"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  addComment,
  createPost,
  deletePost,
  discoverPeople,
  followUser,
  getFeed,
  toggleLike,
  unfollowUser,
  type Post,
  type PostCategory,
  type Profile,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Heart, MessageSquare, Trash, Users } from "lucide-react";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "achievement", label: "Achievement" },
  { value: "certification", label: "Certification" },
  { value: "internship", label: "Internship" },
  { value: "placement", label: "Placement" },
  { value: "academic", label: "Academic" },
];

const CATEGORY_TONE: Record<PostCategory, string> = {
  general: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  achievement: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  certification: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  internship: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  placement: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  academic: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PostCard({
  post,
  currentUserId,
  isAdmin,
  onChanged,
}: {
  post: Post;
  currentUserId: string;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    await toggleLike(post.id);
    onChanged();
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(post.id, commentText);
    setCommentText("");
    setShowComments(true);
    onChanged();
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onChanged();
  };

  const canDelete = post.author_id === currentUserId || isAdmin;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
            {post.author_name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <Link href={`/network/${post.author_id}`} className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
              {post.author_name}
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CATEGORY_TONE[post.category]}`}>
            {CATEGORIES.find((c) => c.value === post.category)?.label}
          </span>
          {canDelete && (
            <button onClick={handleDelete} className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label="Delete post">
              <Trash size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{post.content}</p>

      <div className="mt-3 flex items-center gap-4 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 ${post.liked_by_me ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          <Heart size={15} fill={post.liked_by_me ? "currentColor" : "none"} /> {post.like_count}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400"
        >
          <MessageSquare size={15} /> {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {post.comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-100">{c.author_name}</span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">{c.text}</span>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
              Post
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}

function Feed({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"feed" | "people">("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("general");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshFeed = () => getFeed().then(setPosts);
  const refreshPeople = () => discoverPeople().then(setPeople);

  useEffect(() => {
    refreshFeed();
    refreshPeople();
  }, []);

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createPost({ content, category });
      setContent("");
      setCategory("general");
      await refreshFeed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post that.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowToggle = async (p: Profile) => {
    if (p.is_following) {
      await unfollowUser(p.id);
    } else {
      await followUser(p.id);
    }
    refreshPeople();
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setTab("feed")}
          className={`px-3 py-2 text-sm font-medium ${tab === "feed" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          Feed
        </button>
        <button
          onClick={() => setTab("people")}
          className={`px-3 py-2 text-sm font-medium ${tab === "people" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          Discover People
        </button>
      </div>

      {tab === "feed" ? (
        <div className="flex flex-col gap-4">
          {!isAdmin && (
            <Card>
              <form onSubmit={handlePost} className="flex flex-col gap-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Share an update, ${user?.name.split(" ")[0]}...`}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PostCategory)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </button>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              </form>
            </Card>
          )}

          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={user?.id ?? ""} isAdmin={isAdmin} onChanged={refreshFeed} />
          ))}
          {posts.length === 0 && (
            <Card>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No posts yet — be the first to share something.</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <Link href={`/network/${p.id}`} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      <Users size={11} className="mr-1 inline" />
                      {p.followers_count} followers
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleFollowToggle(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.is_following
                      ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {p.is_following ? "Following" : "Follow"}
                </button>
              </div>
            </Card>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No one else has joined yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student" || user.role === "admin") {
    return <Feed isAdmin={user.role === "admin"} />;
  }
  return <ComingSoon title="Campus Network" />;
}
