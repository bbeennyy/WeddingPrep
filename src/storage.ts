import { createDefaultData, ensureCoupleGuests, uid } from "./defaults";
import { TAG_BY_ID } from "./constants";
import type { Guest, PhotoShot, ProgramItem, ProgramSection, ProgramTag, WeddingData } from "./types";

const STORAGE_KEY = "wedding-prep-data-v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const PROGRAM_SECTION_IDS = new Set<ProgramSection>(["pre-ceremony", "ceremony", "reception"]);

function normalizePhotoShot(raw: unknown): PhotoShot {
  const row = isObject(raw) ? raw : {};
  return {
    id: String(row.id || uid()),
    name: String(row.name ?? ""),
    notes: String(row.notes ?? ""),
    guestIds: Array.isArray(row.guestIds) ? row.guestIds.map((id) => String(id)) : [],
  };
}

function normalizeProgramItem(raw: unknown): ProgramItem {
  const row = isObject(raw) ? raw : {};
  const tag = (typeof row.tag === "string" && row.tag in TAG_BY_ID ? row.tag : "custom") as ProgramTag;
  const section = PROGRAM_SECTION_IDS.has(row.section as ProgramSection)
    ? (row.section as ProgramSection)
    : tag === "prelude"
      ? "pre-ceremony"
      : "ceremony";
  return {
    id: String(row.id || uid()),
    tag,
    section,
    time: typeof row.time === "string" ? row.time : "",
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    body: String(row.body ?? ""),
    people: String(row.people ?? ""),
  };
}

export function parseWeddingData(raw: unknown): WeddingData {
  const fallback = createDefaultData();
  if (!isObject(raw)) return fallback;

  const settings = isObject(raw.settings) ? { ...fallback.settings, ...raw.settings } : fallback.settings;

  const guests = ensureCoupleGuests(Array.isArray(raw.guests) ? (raw.guests as WeddingData["guests"]) : []);
  const photoShots = Array.isArray(raw.photoShots)
    ? raw.photoShots.map(normalizePhotoShot)
    : fallback.photoShots;

  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
    settings: {
      ...settings,
      githubToken: String(settings.githubToken ?? ""),
      partnerA: String(settings.partnerA ?? "").trim() || fallback.settings.partnerA,
      partnerB: partnerBName(settings.partnerB, fallback.settings.partnerB),
      totalBudget: Number(settings.totalBudget) || 0,
    },
    checklist: Array.isArray(raw.checklist) ? (raw.checklist as WeddingData["checklist"]) : fallback.checklist,
    vendors: Array.isArray(raw.vendors) ? (raw.vendors as WeddingData["vendors"]) : fallback.vendors,
    budget: Array.isArray(raw.budget) ? (raw.budget as WeddingData["budget"]) : fallback.budget,
    notes: Array.isArray(raw.notes) ? (raw.notes as WeddingData["notes"]) : fallback.notes,
    guests,
    tables: Array.isArray(raw.tables) ? (raw.tables as WeddingData["tables"]) : fallback.tables,
    photoShots: seedCouplePhoto(photoShots, guests),
    program: Array.isArray(raw.program) ? raw.program.map(normalizeProgramItem) : fallback.program,
  };
}

function partnerBName(value: unknown, fallback: string): string {
  const name = String(value ?? "").trim();
  if (!name || name === "Evelyn Joseph") return fallback;
  return name;
}

function seedCouplePhoto(shots: PhotoShot[], guests: Guest[]): PhotoShot[] {
  const coupleIds = guests
    .filter((guest) => {
      const name = guest.name.trim().toLowerCase();
      return name === "beniamin costea" || name === "evelyn costea";
    })
    .map((guest) => guest.id);
  if (!coupleIds.length) return shots;
  return shots.map((shot) => {
    if (shot.name.trim().toLowerCase() !== "the couple" || shot.guestIds.length) return shot;
    return { ...shot, guestIds: coupleIds };
  });
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

export function withoutToken(data: WeddingData): WeddingData {
  return {
    ...data,
    settings: { ...data.settings, githubToken: "" },
  };
}

export function stampData(data: WeddingData): WeddingData {
  return { ...data, updatedAt: new Date().toISOString() };
}

function timestamp(data: WeddingData): number {
  const value = Date.parse(data.updatedAt);
  return Number.isFinite(value) ? value : 0;
}

function richness(data: WeddingData): number {
  return (
    data.guests.length * 10 +
    data.checklist.filter((item) => item.done).length * 3 +
    data.vendors.length +
    data.budget.filter((item) => item.paid).length +
    data.notes.length +
    (data.settings.partnerA.trim() ? 1 : 0) +
    (data.settings.partnerB.trim() ? 1 : 0)
  );
}

/** Prefer the newest copy. Clearly richer shared data wins over an empty browser shell. */
export function chooseWeddingData(
  local: WeddingData,
  file: WeddingData | null,
  remote: WeddingData | null,
): WeddingData {
  const candidates = [remote, file, local].filter((row): row is WeddingData => row !== null);
  return candidates.reduce((best, row) => {
    const richDiff = richness(row) - richness(best);
    // ~3+ guests of extra substance beats a newer empty Pages visit
    if (richDiff >= 30) return row;
    if (richDiff <= -30) return best;
    const timeDiff = timestamp(row) - timestamp(best);
    if (timeDiff > 0) return row;
    if (timeDiff < 0) return best;
    return richDiff > 0 ? row : best;
  });
}

export function hasGithubRepo(settings: WeddingData["settings"]): boolean {
  return Boolean(settings.githubOwner.trim() && settings.githubRepo.trim());
}

export function hasGithubTarget(settings: WeddingData["settings"]): boolean {
  return hasGithubRepo(settings) && Boolean(settings.githubToken.trim());
}

async function readWeddingPayload(url: string): Promise<WeddingData | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return parseWeddingData(await res.json());
  } catch {
    return null;
  }
}

export async function loadFileData(): Promise<WeddingData | null> {
  // Local Vite API (writes the same data/wedding.json on disk while developing)
  const fromApi = await readWeddingPayload("/api/wedding-data");
  if (fromApi) return fromApi;

  // GitHub Pages / static hosting: ship a copy of data/wedding.json with the build
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return readWeddingPayload(`${base}data/wedding.json`);
}

/** Latest committed file on GitHub (public raw URL works without a token). */
export async function pullFromGithubRaw(settings: WeddingData["settings"]): Promise<WeddingData | null> {
  if (!hasGithubRepo(settings)) return null;
  const target = targetFromSettings(settings);
  const url =
    `https://raw.githubusercontent.com/${target.owner}/${target.repo}/` +
    `${encodeURIComponent(target.branch)}/${target.path.replace(/^\/+/, "")}` +
    `?t=${Date.now()}`;
  return readWeddingPayload(url);
}

/** Prefer authenticated API; fall back to public raw for read-only devices. */
export async function pullLatestShared(settings: WeddingData["settings"]): Promise<WeddingData | null> {
  if (hasGithubTarget(settings)) {
    try {
      return await pullFromGithub(targetFromSettings(settings));
    } catch {
      /* try raw next */
    }
  }
  return pullFromGithubRaw(settings);
}

export async function saveFileData(data: WeddingData): Promise<boolean> {
  try {
    const res = await fetch("/api/wedding-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutToken(data), null, 2),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function exportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `wedding-prep-${stamp}.json`;
}

function countUnquoted(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) count += 1;
  }
  return count;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const commas = countUnquoted(firstLine, ",");
  const semis = countUnquoted(firstLine, ";");
  const tabs = countUnquoted(firstLine, "\t");
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function parseCsvRows(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Spreadsheet columns A/B/C: first name, last name, party. Row 1 is the header. */
export function parseGuestCsv(text: string): Guest[] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const rows = parseCsvRows(cleaned);
  if (rows.length < 2) return [];

  const guests: Guest[] = [];
  const seen = new Set<string>();

  for (const row of rows.slice(1)) {
    const first = (row[0] ?? "").trim();
    const last = (row[1] ?? "").trim();
    const party = (row[2] ?? "").trim();
    const name = [first, last].filter(Boolean).join(" ");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    guests.push({
      id: uid(),
      name,
      side: "both",
      rsvp: "pending",
      dietary: "",
      notes: "",
      tableId: null,
      group: party,
    });
  }

  return guests;
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

  async function putWithSha(sha?: string): Promise<Response> {
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    return fetch(putUrl, {
      method: "PUT",
      headers: githubHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        message: "Update wedding planner data",
        content: encodeContent(JSON.stringify(withoutToken(data), null, 2)),
        branch,
        sha,
      }),
    });
  }

  async function currentSha(): Promise<string | undefined> {
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const existing = await fetch(getUrl, { headers: githubHeaders(token) });
    if (existing.ok) {
      const payload = (await existing.json()) as { sha?: string };
      return payload.sha;
    }
    if (existing.status === 404) return undefined;
    throw new Error(`Could not read the GitHub file (${existing.status}).`);
  }

  let sha = await currentSha();
  let res = await putWithSha(sha);
  // Another device saved first — retry once with the fresh SHA
  if (res.status === 409) {
    sha = await currentSha();
    res = await putWithSha(sha);
  }

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
