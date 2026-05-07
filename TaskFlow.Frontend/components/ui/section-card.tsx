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
    <section className="surface-card rounded-[1.75rem] p-6 md:p-8">
      <div className="mb-6 flex items-start gap-4">
        {Icon ? (
          <div className="inline-flex rounded-[1.25rem] bg-white/8 p-4">
            <Icon className="h-6 w-6 text-cyan-300" />
          </div>
        ) : null}
        <div>
          <h2 className="text-gradient-soft font-[family-name:var(--font-heading)] text-3xl font-semibold">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}
