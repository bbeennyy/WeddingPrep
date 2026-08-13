import { createDefaultData } from "./defaults";
import type { WeddingData } from "./types";

const STORAGE_KEY = "wedding-prep-data-v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseWeddingData(raw: unknown): WeddingData {
  const fallback = createDefaultData();
  if (!isObject(raw)) return fallback;

  const settings = isObject(raw.settings) ? { ...fallback.settings, ...raw.settings } : fallback.settings;

  return {
    version: 1,
    settings: {
      ...settings,
      githubToken: String(settings.githubToken ?? ""),
    },
    checklist: Array.isArray(raw.checklist) ? (raw.checklist as WeddingData["checklist"]) : fallback.checklist,
    vendors: Array.isArray(raw.vendors) ? (raw.vendors as WeddingData["vendors"]) : fallback.vendors,
    budget: Array.isArray(raw.budget) ? (raw.budget as WeddingData["budget"]) : fallback.budget,
    notes: Array.isArray(raw.notes) ? (raw.notes as WeddingData["notes"]) : fallback.notes,
    guests: Array.isArray(raw.guests) ? (raw.guests as WeddingData["guests"]) : fallback.guests,
    tables: Array.isArray(raw.tables) ? (raw.tables as WeddingData["tables"]) : fallback.tables,
    program: Array.isArray(raw.program) ? (raw.program as WeddingData["program"]) : fallback.program,
  };
}

export function loadLocal(): WeddingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    return parseWeddingData(JSON.parse(raw));
  } catch {
    return createDefaultData();
  }
}

export function saveLocal(data: WeddingData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `wedding-prep-${stamp}.json`;
}

export function downloadData(data: WeddingData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFilename();
  a.click();
  URL.revokeObjectURL(url);
}

function encodeContent(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeContent(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export interface GithubTarget {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

function githubHeaders(token: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function pullFromGithub(target: GithubTarget): Promise<WeddingData> {
  const { owner, repo, path, branch, token } = target;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (res.status === 404) {
    throw new Error("No shared file yet. Save to GitHub once to create it.");
  }
  if (!res.ok) {
    throw new Error(`Could not load from GitHub (${res.status}). Check owner, repo, path, and token.`);
  }
  const payload = (await res.json()) as { content?: string };
  if (!payload.content) throw new Error("GitHub returned an empty file.");
  return parseWeddingData(JSON.parse(decodeContent(payload.content)));
}

export async function pushToGithub(target: GithubTarget, data: WeddingData): Promise<void> {
  const { owner, repo, path, branch, token } = target;
  if (!token) throw new Error("Add a GitHub token in Settings first.");

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const existing = await fetch(getUrl, { headers: githubHeaders(token) });
  let sha: string | undefined;
  if (existing.ok) {
    const payload = (await existing.json()) as { sha?: string };
    sha = payload.sha;
  } else if (existing.status !== 404) {
    throw new Error(`Could not read the GitHub file (${existing.status}).`);
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: githubHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      message: "Update wedding planner data",
      content: encodeContent(JSON.stringify(data, null, 2)),
      branch,
      sha,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Could not save to GitHub (${res.status}). ${detail.slice(0, 180)}`);
  }
}

export function targetFromSettings(settings: WeddingData["settings"]): GithubTarget {
  return {
    owner: settings.githubOwner.trim(),
    repo: settings.githubRepo.trim(),
    branch: settings.githubBranch.trim() || "main",
    path: settings.githubPath.trim() || "data/wedding.json",
    token: settings.githubToken.trim(),
  };
}
