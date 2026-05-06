"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";

type TextField = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea";
};

type SelectField = {
  id: string;
  label: string;
  options: Array<{ label: string; value: string }>;
};

type CreateResourceCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  savingLabel: string;
  textFields: TextField[];
  selectFields?: SelectField[];
  initialValues: Record<string, string>;
  error: string | null;
  onSubmit: (values: Record<string, string>) => Promise<void>;
};

export function CreateResourceCard({
  title,
  description,
  submitLabel,
  savingLabel,
  textFields,
  selectFields = [],
  initialValues,
  error,
  onSubmit,
}: CreateResourceCardProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit(values);
      setValues(initialValues);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel rounded-[1.75rem] p-6 md:p-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="inline-flex rounded-[1.25rem] bg-slate-100 p-4">
          <Plus className="h-6 w-6 text-slate-800" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        {textFields.map((field) => (
          <Field key={field.id} label={field.label}>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.id] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.id]: event.target.value }))
                }
                placeholder={field.placeholder}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            ) : (
              <input
                type="text"
                value={values[field.id] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.id]: event.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            )}
          </Field>
        ))}

        {selectFields.map((field) => (
          <Field key={field.id} label={field.label}>
            <select
              value={values[field.id] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field.id]: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        ))}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 lg:col-span-2">
            {error}
          </div>
        ) : null}

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
