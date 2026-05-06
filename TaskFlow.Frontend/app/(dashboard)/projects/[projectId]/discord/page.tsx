"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquareMore, Trash2 } from "lucide-react";

import { AuthGate } from "@/components/auth/auth-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardPage } from "@/components/layout/dashboard-page";
import {
  deleteProjectDiscordIntegration,
  getProjectDiscordIntegration,
  upsertProjectDiscordIntegration,
} from "@/lib/api";

export default function ProjectDiscordPage() {
  const params = useParams<{ projectId: string }>();
  const { session } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getProjectDiscordIntegration(session, params.projectId)
      .then((integration) => {
        if (!integration) {
          setWebhookUrl("");
          setIsEnabled(true);
          return;
        }

        setWebhookUrl(integration.webhookUrl);
        setIsEnabled(integration.isEnabled);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load integration.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.projectId, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await upsertProjectDiscordIntegration(session, params.projectId, {
        webhookUrl,
        isEnabled,
      });
      setMessage("Discord integration saved.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save integration.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await deleteProjectDiscordIntegration(session, params.projectId);
      setWebhookUrl("");
      setIsEnabled(true);
      setMessage("Discord integration removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove integration.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Project Discord"
        title="Discord delivery settings"
        description="Wire a project directly to its own Discord webhook so only the right task events land in the right place."
      >
        <section className="glass-panel max-w-3xl rounded-[1.75rem] p-6 md:p-8">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-40 rounded-full bg-white/80" />
              <div className="h-14 rounded-2xl bg-white/70" />
              <div className="h-14 rounded-2xl bg-white/70" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="inline-flex rounded-[1.25rem] bg-slate-100 p-4">
                <MessageSquareMore className="h-6 w-6 text-slate-800" />
              </div>

              <div className="space-y-2">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-slate-950">
                  Project {params.projectId}
                </h2>
                <p className="text-sm leading-7 text-slate-600">
                  Use the project-specific endpoints you already built to keep Discord routing isolated.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Webhook URL</span>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div>
                  <p className="font-medium text-slate-900">Enable webhook delivery</p>
                  <p className="mt-1 text-sm text-slate-500">
                    When enabled, task create and update events can flow to this project channel.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(event) => setIsEnabled(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                />
              </label>

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

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || !webhookUrl.trim()}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save integration"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </form>
          )}
        </section>
      </DashboardPage>
    </AuthGate>
  );
}
