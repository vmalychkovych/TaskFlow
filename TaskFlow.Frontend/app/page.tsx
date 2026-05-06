import Link from "next/link";
import { ArrowRight, Boxes, FolderKanban, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="hero-mesh min-h-screen px-6 py-8 text-slate-900 md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between gap-10">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
              TaskFlow
            </p>
            <p className="text-sm text-slate-500">Next.js shell for your .NET API</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Register
            </Link>
            <Link
              href="/workspaces"
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Open app
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm text-teal-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Clean workspace, project, and task flows
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
                A sharper front-end shell for your TaskFlow backend.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                This starter is designed around the API you already built:
                workspaces, project members, assigned tasks, unassigned queues,
                and Discord settings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/workspaces"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tasks/my"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                See my tasks
              </Link>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-4">
              <FeatureCard
                icon={<Boxes className="h-5 w-5 text-teal-700" />}
                title="Workspace-first"
                description="Map your backend membership model directly to a calm, modern SaaS shell."
              />
              <FeatureCard
                icon={<FolderKanban className="h-5 w-5 text-amber-600" />}
                title="Project-driven work"
                description="Surface project members, Discord webhooks, and task queues without UI overkill."
              />
              <FeatureCard
                icon={<Sparkles className="h-5 w-5 text-rose-600" />}
                title="Ready for polish"
                description="Tailwind v4 foundation, bold typography, and room for shadcn/ui blocks next."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">{icon}</div>
      <h2 className="mb-2 font-[family-name:var(--font-heading)] text-xl font-semibold text-slate-950">
        {title}
      </h2>
      <p className="text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}
