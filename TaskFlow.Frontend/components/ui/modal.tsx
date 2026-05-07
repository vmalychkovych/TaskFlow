"use client";

import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";

import { TaskFlowBrand } from "@/components/branding/taskflow-brand";

type ModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-md"
      />

      <div className="modal-surface fade-up pulse-glow relative z-10 w-full max-w-4xl overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="ambient-orb ambient-orb--violet absolute -left-12 top-10 h-40 w-40" />
        <div className="ambient-orb ambient-orb--blue absolute bottom-0 right-0 h-52 w-52" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="auth-shell float-slow rounded-[1.6rem] border border-white/8 px-6 py-7 text-white">
            <TaskFlowBrand compact />
            <div className="mt-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Quick create
              </div>
              <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                Ship the next item without leaving your flow.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                Add workspaces, projects, and tasks from a focused command surface with better contrast and less noise.
              </p>
            </div>
          </aside>

          <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Quick create
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="button-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
