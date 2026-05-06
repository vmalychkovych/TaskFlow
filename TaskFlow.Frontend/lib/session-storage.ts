import type { AuthResponse } from "@/lib/types";

const STORAGE_KEY = "taskflow.auth";

export function getStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthResponse) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(STORAGE_KEY);
}
