"use client";

export const RESOURCE_CREATED_EVENT = "taskflow:resource-created";

export function emitResourceCreated() {
  window.dispatchEvent(new Event(RESOURCE_CREATED_EVENT));
}
