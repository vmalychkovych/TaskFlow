import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <main className="hero-mesh flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel w-full max-w-5xl overflow-hidden rounded-[2rem]">
        <div className="grid min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="flex flex-col justify-between bg-slate-950 px-8 py-10 text-white">
            <div className="space-y-5">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-teal-300">
                TaskFlow
              </p>
              <h1 className="max-w-md font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                Bring your workspace, project, and task flow into one calm dashboard.
              </h1>
              <p className="max-w-md text-sm leading-7 text-slate-300">
                Sign in with your API-backed account and start wiring the frontend
                directly to your .NET auth, workspace, and task endpoints.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Supports `Auth/Login`, `Auth/Me`, workspace members, project members,
                assigned tasks, and Discord settings.
              </p>
            </div>
          </aside>

          <section className="bg-white/90 px-6 py-8 md:px-10 md:py-12">
            <LoginForm nextPath={resolvedSearchParams.next} />
          </section>
        </div>
      </div>
    </main>
  );
}
