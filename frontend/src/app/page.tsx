import Link from "next/link";
import { Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-zinc-50 px-4 text-center dark:from-zinc-950 dark:to-black">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Bot size={20} />
        </span>
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">CampusAI</span>
      </div>

      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
        One campus ecosystem for academics, AI, and careers
      </h1>
      <p className="mt-4 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
        Smart classrooms, an AI assistant that knows your coursework, and a placement portal —
        all connected to one student profile.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
