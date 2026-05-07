import type { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass-panel rounded-[1.75rem] px-6 py-10 text-center">
      <div className="mx-auto inline-flex rounded-[1.25rem] bg-white/8 p-4">
        <Icon className="h-6 w-6 text-cyan-300" />
      </div>
      <h2 className="mt-5 font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
        {description}
      </p>
    </div>
  );
}
