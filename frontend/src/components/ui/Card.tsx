import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-900/60",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
