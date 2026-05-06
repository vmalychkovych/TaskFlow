"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
      router.push(nextPath || "/workspaces");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Welcome back
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-slate-950">
          Sign in to TaskFlow
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          Use the same credentials as your ASP.NET API.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@taskflow.app"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-sm text-slate-500">
          Need an account?{" "}
          <Link href="/register" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}
