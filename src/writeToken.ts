const STORAGE_KEY = "wedding-prep-write-token";

export function getWriteToken(settingsToken = ""): string {
  const baked = String(import.meta.env.VITE_GITHUB_TOKEN ?? "").trim();
  if (baked) return baked;
  try {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return settingsToken.trim();
}

export function setWriteToken(token: string): void {
  const value = token.trim();
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasWriteToken(settingsToken = ""): boolean {
  return Boolean(getWriteToken(settingsToken));
}
