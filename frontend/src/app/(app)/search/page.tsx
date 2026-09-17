"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { globalSearch, type SearchCategory, type SearchResult } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import {
  Award,
  Briefcase,
  Building2,
  FolderCog,
  Layers,
  Search as SearchIcon,
  Users,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_META: Record<SearchCategory, { label: string; icon: LucideIcon }> = {
  people: { label: "People", icon: Users },
  courses: { label: "Courses", icon: Award },
  companies: { label: "Companies", icon: Building2 },
  opportunities: { label: "Opportunities", icon: Briefcase },
  posts: { label: "Campus Network", icon: Layers },
  materials: { label: "Materials", icon: FolderCog },
};

const CATEGORY_ORDER: SearchCategory[] = ["people", "courses", "opportunities", "companies", "materials", "posts"];

function ResultRow({ result }: { result: SearchResult }) {
  const content = (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{result.title}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{result.subtitle}</p>
      </div>
    </div>
  );

  if (!result.link) return content;
  return (
    <Link href={result.link} className="block transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      {content}
    </Link>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  return <SearchResults key={initialQ} initialQ={initialQ} />;
}

function SearchResults({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(initialQ.trim().length >= 2);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQ.trim().length < 2) return;
    globalSearch(initialQ)
      .then((data) => {
        setResults(data);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  }, [initialQ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: results.filter((r) => r.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Search</h1>

      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          autoFocus
          placeholder="Search people, courses, opportunities, and more..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-500/20"
        />
      </form>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <Card>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            No results for &quot;{initialQ}&quot;.
          </p>
        </Card>
      )}

      {!loading &&
        grouped.map(({ category, items }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          return (
            <Card key={category}>
              <div className="mb-3 flex items-center gap-2">
                <Icon size={15} className="text-zinc-400" />
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  {meta.label}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <ResultRow key={`${r.category}-${r.id}`} result={r} />
                ))}
              </div>
            </Card>
          );
        })}

      {!loading && !searched && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start typing at least 2 characters to search across CampusAI.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>}>
      <SearchPageContent />
    </Suspense>
  );
}
