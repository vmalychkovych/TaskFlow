import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, FolderKanban, Sparkles, Wand2 } from "lucide-react";

import { TaskFlowBrand } from "@/components/branding/taskflow-brand";

export default function HomePage() {
  return (
    <main className="hero-mesh min-h-screen px-6 py-8 text-white md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between gap-10">
        <header className="glass-panel fade-up flex items-center justify-between rounded-[1.8rem] border border-white/10 px-5 py-4 backdrop-blur">
          <TaskFlowBrand compact />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="button-secondary rounded-full px-4 py-2 text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="button-secondary rounded-full px-4 py-2 text-sm font-medium"
            >
              Register
            </Link>
            <Link
              href="/workspaces"
              className="button-primary rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open app
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="fade-up space-y-8" style={{ animationDelay: "120ms" }}>
            <div className="button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-cyan-100 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Sharper workspace, project, and task flows
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight text-white md:text-7xl">
                Your backend now deserves a product-grade face.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                TaskFlow now leans into the logo palette you dropped: violet-blue gradients, darker contrast, focused modal creation, and motion that feels intentional instead of noisy.
              </p>
              <p className="max-w-2xl text-base leading-8 text-slate-400">
                The UI is still designed around the API you already built:
                workspaces, project members, assigned tasks, unassigned queues,
                and Discord settings.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/workspaces"
                className="button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tasks/my"
                className="button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                See my tasks
              </Link>
            </div>
          </div>

          <div
            className="fade-up glass-panel relative min-h-[34rem] overflow-hidden rounded-[2rem] p-6 md:p-8"
            style={{ animationDelay: "220ms" }}
          >
            <Image
              src="/images/taskflow-hero-generated.png"
              alt="TaskFlow workspace orchestration illustration"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,18,0.18),rgba(7,10,24,0.72)_58%,rgba(6,9,21,0.92)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(82,208,255,0.16),transparent_28%)]" />
            <div className="ambient-orb ambient-orb--violet absolute -left-10 top-0 h-36 w-36" />
            <div className="ambient-orb ambient-orb--blue absolute bottom-0 right-0 h-40 w-40" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <article className="float-slow max-w-sm rounded-[1.7rem] border border-white/12 bg-[linear-gradient(145deg,rgba(20,25,52,0.92),rgba(9,13,31,0.82))] p-5 text-white shadow-[0_20px_45px_rgba(3,7,18,0.35)] backdrop-blur-md">
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.2em] text-cyan-200">
                    <Wand2 className="h-3.5 w-3.5" />
                    Hero visual
                  </div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                    live
                  </span>
                </div>
                <TaskFlowBrand />
              </article>

              <div className="grid gap-4 md:grid-cols-3 md:items-end">
                <FeatureCard
                  icon={<Boxes className="h-5 w-5 text-teal-700" />}
                  title="Workspace-first"
                  description="Map your backend membership model directly to a higher-contrast SaaS shell."
                />
                <FeatureCard
                  icon={<FolderKanban className="h-5 w-5 text-amber-600" />}
                  title="Project-driven work"
                  description="Surface project members, Discord webhooks, and task queues without flat admin-panel energy."
                />
                <FeatureCard
                  icon={<Sparkles className="h-5 w-5 text-rose-600" />}
                  title="Ready for polish"
                  description="Tailwind v4 foundation, animated gradients, and room for even richer motion next."
                />
              </div>
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
    <article className="rounded-[1.5rem] border border-white/10 bg-[rgba(7,10,24,0.72)] p-5 shadow-sm backdrop-blur-md">
      <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">{icon}</div>
      <h2 className="mb-2 font-[family-name:var(--font-heading)] text-xl font-semibold text-white">
        {title}
      </h2>
      <p className="text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}
