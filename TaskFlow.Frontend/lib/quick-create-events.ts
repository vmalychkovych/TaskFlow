"use client";

import type { QuickCreateTarget } from "@/components/forms/quick-create-hub";

export const QUICK_CREATE_EVENT = "taskflow:quick-create";

export type QuickCreateRequest = {
  target: Exclude<QuickCreateTarget, null>;
  workspaceId?: string;
  projectId?: string;
};

export function emitQuickCreate(request: QuickCreateRequest) {
  window.dispatchEvent(new CustomEvent<QuickCreateRequest>(QUICK_CREATE_EVENT, { detail: request }));
}
