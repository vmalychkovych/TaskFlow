import type { LucideIcon } from "lucide-react";

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-[1.75rem] p-6 md:p-8">
      <div className="mb-6 flex items-start gap-4">
        {Icon ? (
          <div className="inline-flex rounded-[1.25rem] bg-slate-100 p-4">
            <Icon className="h-6 w-6 text-slate-800" />
          </div>
        ) : null}
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}
