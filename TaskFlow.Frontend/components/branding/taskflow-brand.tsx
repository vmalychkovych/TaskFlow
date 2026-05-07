"use client";

import { cn } from "@/lib/cn";

export function TaskFlowBrand({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", compact ? "gap-3" : "gap-5", className)}>
      <div className={cn("brand-mark", compact ? "h-12 w-12" : "h-[4.5rem] w-[4.5rem]")}>
        <span className="brand-mark__line brand-mark__line--top" />
        <span className="brand-mark__line brand-mark__line--mid" />
        <span className="brand-mark__line brand-mark__line--bottom" />
        <span className="brand-mark__check brand-mark__check--short" />
        <span className="brand-mark__check brand-mark__check--long" />
      </div>

      <div className="space-y-1">
        <p
          className={cn(
            "font-[family-name:var(--font-heading)] font-semibold tracking-tight text-white",
            compact ? "text-xl" : "text-4xl",
          )}
        >
          <span className="text-white">Task</span>
          <span className="brand-text-gradient">Flow</span>
        </p>
        {!compact ? (
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            Workspace-driven delivery with a cleaner, more modern control surface.
          </p>
        ) : null}
      </div>
    </div>
  );
}
