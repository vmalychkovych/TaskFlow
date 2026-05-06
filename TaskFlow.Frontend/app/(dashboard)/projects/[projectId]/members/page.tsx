"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AuthGate } from "@/components/auth/auth-gate";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { MemberManager } from "@/components/members/member-manager";
import { useAuth } from "@/components/providers/auth-provider";
import {
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
} from "@/lib/api";
import type { ProjectMember } from "@/lib/types";

const projectRoles = [
  { label: "Project Member", value: 2 },
  { label: "Project Admin", value: 1 },
  { label: "Viewer", value: 3 },
];

export default function ProjectMembersPage() {
  const params = useParams<{ projectId: string }>();
  const { session } = useAuth();
  const [items, setItems] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const members = await getProjectMembers(session, params.projectId);
      setItems(members);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }, [params.projectId, session]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleAdd(userId: string, role: number) {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addProjectMember(session, params.projectId, { userId, role });
      await loadMembers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to add member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!session) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await removeProjectMember(session, params.projectId, userId);
      await loadMembers();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <DashboardPage
        eyebrow="Project Members"
        title="Manage project access"
        description="Project membership lets you keep workspaces broad but project scopes focused, which matches the backend access model you built."
      >
        <MemberManager
          title={`Project ${params.projectId}`}
          description="Only workspace members should be added here. Promote a collaborator to project admin when they need member and settings control."
          dateLabel="Added"
          items={items}
          loading={loading}
          error={error}
          saving={saving}
          roleOptions={projectRoles}
          getDate={(member) => new Date(member.addedAt).toLocaleDateString()}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </DashboardPage>
    </AuthGate>
  );
}
