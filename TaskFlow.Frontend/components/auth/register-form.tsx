"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { register } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      setMessage("Account created. You can sign in now.");

      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to register.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          First time here
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-slate-950">
          Create your TaskFlow account
        </h2>
        <p className="text-sm leading-7 text-slate-600">
          This form posts directly to your ASP.NET `Auth/register` endpoint.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="First name"
            type="text"
            value={firstName}
            onChange={setFirstName}
            placeholder="Vlad"
          />
          <Field
            label="Last name"
            type="text"
            value={lastName}
            onChange={setLastName}
            placeholder="Malykhovskyi"
          />
        </div>

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
          placeholder="Create a strong password"
        />

        {message ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={
            submitting ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
            Sign in
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
