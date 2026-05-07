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
    <div className="fade-up mx-auto flex h-full w-full max-w-lg flex-col justify-center">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300/90">
          First time here
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-white">
          Create your TaskFlow account
        </h2>
        <p className="text-sm leading-7 text-slate-300">
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
          <div className="status-message status-message--success">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="status-message status-message--error">
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
          className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white underline-offset-4 hover:text-cyan-200 hover:underline">
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
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="dashboard-input w-full rounded-2xl px-4 py-3.5"
      />
    </label>
  );
}
