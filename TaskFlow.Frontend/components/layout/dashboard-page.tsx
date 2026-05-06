export function DashboardPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="space-y-6">
      <section className="glass-panel hero-mesh rounded-[2rem] px-6 py-8 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          {description}
        </p>
      </section>

      {children}
    </main>
  );
}
