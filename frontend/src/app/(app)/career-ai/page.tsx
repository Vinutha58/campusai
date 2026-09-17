"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  clearCareerChatHistory,
  getCareerChatHistory,
  sendCareerChatMessage,
  type ChatMessage,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { Compass, Send, Trash, TriangleAlert } from "lucide-react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function CareerAIContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCareerChatHistory()
      .then(setMessages)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setError(null);
    setSending(true);
    try {
      const exchange = await sendCareerChatMessage(content);
      setMessages((m) => [...m, exchange.user_message, exchange.assistant_message]);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        getCareerChatHistory().then(setMessages);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    await clearCareerChatHistory();
    setMessages([]);
    setError(null);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Compass size={20} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Career AI</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Roadmap, skill gaps, interviews</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Trash size={13} /> Clear
          </button>
        )}
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {loaded && messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <Compass size={28} className="text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ask about career roadmaps, skill gaps for a target role, or interview strategy.
              </p>
            </div>
          )}
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    isUser
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <p>{m.content}</p>
                  <p className={`mt-1 text-[10px] ${isUser ? "text-violet-100" : "text-zinc-400"}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Career AI is thinking...
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800"
        >
          <input
            type="text"
            placeholder="Ask Career AI anything..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            <Send size={14} />
          </button>
        </form>
      </Card>
    </div>
  );
}

export default function CareerAIPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student") return <CareerAIContent />;
  return <ComingSoon title="Career AI" />;
}
