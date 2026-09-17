"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getConversations,
  getMessages,
  searchUsersToMessage,
  sendMessage,
  startConversation,
  type Conversation,
  type Message,
  type UserSearchResult,
} from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";
import { ArrowLeft, Search, Send } from "lucide-react";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function NewMessageSearch({ onStart }: { onStart: (conversation: Conversation) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timeout = setTimeout(() => {
      searchUsersToMessage(query).then(setResults);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  const handleSelect = async (user: UserSearchResult) => {
    const convo = await startConversation(user.id);
    setQuery("");
    setResults([]);
    onStart(convo);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Message someone new..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      {visibleResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {visibleResults.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                {initials(u.name)}
              </span>
              <div>
                <p className="text-zinc-800 dark:text-zinc-100">{u.name}</p>
                <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{u.role.replace("_", " ")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesPageContent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshConversations = () => getConversations().then(setConversations);

  useEffect(() => {
    refreshConversations();
    const interval = setInterval(refreshConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const load = () => getMessages(activeId).then(setMessages);
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !text.trim()) return;
    const sent = await sendMessage(activeId, text);
    setMessages((m) => [...m, sent]);
    setText("");
    refreshConversations();
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-full gap-4">
      <div className={`w-full shrink-0 flex-col gap-3 lg:flex lg:w-72 ${activeId ? "hidden" : "flex"}`}>
        <NewMessageSearch
          onStart={(convo) => {
            setActiveId(convo.id);
            refreshConversations();
          }}
        />
        <Card className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left ${
                    activeId === c.id ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                    {initials(c.other_user_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{c.other_user_name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{c.last_message ?? "No messages yet"}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-medium text-white">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {conversations.length === 0 && (
              <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">No conversations yet.</p>
            )}
          </ul>
        </Card>
      </div>

      <Card className={`flex-1 flex-col lg:flex ${activeId ? "flex" : "hidden"}`}>
        {activeConversation ? (
          <>
            <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <button
                onClick={() => setActiveId(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                {initials(activeConversation.other_user_name)}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{activeConversation.other_user_name}</p>
                <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{activeConversation.other_user_role.replace("_", " ")}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {messages.map((m) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMine
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className={`mt-1 text-[10px] ${isMine ? "text-indigo-100" : "text-zinc-400"}`}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="mt-3 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Select a conversation, or search for someone to message.
          </div>
        )}
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "student" || user.role === "faculty" || user.role === "placement_officer") {
    return <MessagesPageContent />;
  }
  return <ComingSoon title="Messaging" />;
}
