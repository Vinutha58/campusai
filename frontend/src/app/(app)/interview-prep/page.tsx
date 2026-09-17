"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  generateInterviewSession,
  getInterviewSessions,
  submitInterviewAnswer,
  type InterviewSession,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Mic, TriangleAlert } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function QuestionCard({
  session,
  index,
  onAnswered,
}: {
  session: InterviewSession;
  index: number;
  onAnswered: (updated: InterviewSession) => void;
}) {
  const q = session.questions[index];
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const updated = await submitInterviewAnswer(session.id, index, answer.trim());
      onAnswered(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't get feedback right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {index + 1}. {q.question}
      </p>

      {q.feedback ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {q.answer}
          </p>
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            {q.feedback}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Type your answer..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!answer.trim() || submitting}
            className="self-start rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Getting feedback..." : "Submit answer"}
          </button>
        </form>
      )}
    </div>
  );
}

function InterviewPrepContent() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getInterviewSessions()
      .then((data) => {
        setSessions(data);
        setActiveId(data[0]?.id ?? null);
      })
      .finally(() => setLoaded(true));
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || generating) return;
    setError(null);
    setGenerating(true);
    try {
      const session = await generateInterviewSession(topic.trim());
      setSessions((s) => [session, ...s]);
      setActiveId(session.id);
      setTopic("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate questions right now.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswered = (updated: InterviewSession) => {
    setSessions((s) => s.map((sess) => (sess.id === updated.id ? updated : sess)));
  };

  if (!loaded) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Mic size={20} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Interview Preparation</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Practice with AI-generated mock questions</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Topic or target role
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Data Structures, Frontend Developer"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={!topic.trim() || generating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate questions"}
          </button>
        </form>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {activeSession ? (
            <>
              <CardHeader title={activeSession.topic} subtitle={formatDate(activeSession.created_at)} />
              <div className="flex flex-col gap-3">
                {activeSession.questions.map((_, i) => (
                  <QuestionCard key={i} session={activeSession} index={i} onAnswered={handleAnswered} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Generate a set of questions above to start practicing.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Past sessions" />
          <ul className="flex flex-col gap-1">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveId(s.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    activeId === s.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  <p className="truncate font-medium">{s.topic}</p>
                  <p className="text-xs text-zinc-400">{formatDate(s.created_at)}</p>
                </button>
              </li>
            ))}
            {sessions.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No sessions yet.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function InterviewPrepPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <InterviewPrepContent />;
  return <ComingSoon title="Interview Preparation" />;
}
