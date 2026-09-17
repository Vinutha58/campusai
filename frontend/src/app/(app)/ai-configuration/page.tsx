"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  getAIConfig,
  updateAIConfig,
  type AIConfig,
  type AIProviderName,
} from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";
import { ComingSoon } from "@/components/dashboard/ComingSoon";

const PROVIDERS: { value: AIProviderName; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
  { value: "claude", label: "Anthropic Claude" },
];

function AIConfiguration() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [provider, setProvider] = useState<AIProviderName>("openai");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getAIConfig().then((data) => {
      setConfig(data);
      if (data.provider) setProvider(data.provider);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const updated = await updateAIConfig({ provider, api_key: apiKey || undefined });
      setConfig(updated);
      setApiKey("");
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save the configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader
          title="AI Provider Configuration"
          subtitle="Used by CampusGPT and Career AI once those are built — not consumed anywhere yet."
        />

        {config && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Current: <span className="font-medium">{config.provider ?? "none set"}</span>
            {config.has_key && <> · key ending <span className="font-mono">{config.key_preview}</span></>}
            {!config.has_key && " · no key set"}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProviderName)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              API key {config?.has_key && "(leave blank to keep the current key)"}
            </label>
            <input
              type="password"
              placeholder={config?.has_key ? "•••••••••••••••" : "sk-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save configuration"}
          </button>
        </form>
      </Card>
    </div>
  );
}

export default function AIConfigurationPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "admin") return <AIConfiguration />;
  return <ComingSoon title="AI Configuration" />;
}
