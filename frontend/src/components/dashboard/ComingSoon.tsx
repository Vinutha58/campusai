export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Coming soon</p>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        This part of CampusAI is being built in an upcoming milestone.
      </p>
    </div>
  );
}
