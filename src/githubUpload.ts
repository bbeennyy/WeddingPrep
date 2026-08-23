import type { WeddingData } from "./types";

function serialize(data: WeddingData): string {
  return JSON.stringify(
    { ...data, settings: { ...data.settings, githubToken: "" } },
    null,
    2,
  );
}

export interface GithubTarget {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

function headers(token: string): Headers {
  const h = new Headers();
  h.set("Accept", "application/vnd.github+json");
  h.set("X-GitHub-Api-Version", "2022-11-28");
  h.set("Authorization", `Bearer ${token}`);
  h.set("Content-Type", "application/json");
  return h;
}

async function api<T>(token: string, url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: headers(token),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error("GitHub rejected the write key. Paste a Contents read/write token once in Settings.");
    }
    throw new Error(`GitHub ${res.status}: ${detail.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

/**
 * Commit data/wedding.json the normal git way: blob → tree → commit → move main.
 * No file-SHA dance. If another phone committed first, retry from the new tip.
 */
export async function commitWeddingJson(target: GithubTarget, data: WeddingData): Promise<void> {
  const { owner, repo, branch, path, token } = target;
  if (!token) throw new Error("No GitHub write key on this phone yet.");

  const text = serialize(data);
  const root = `https://api.github.com/repos/${owner}/${repo}`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ref = await api<{ object: { sha: string } }>(
      token,
      `${root}/git/ref/heads/${encodeURIComponent(branch)}`,
    );
    const parent = ref.object.sha;

    const commit = await api<{ tree: { sha: string } }>(token, `${root}/git/commits/${parent}`);

    const blob = await api<{ sha: string }>(token, `${root}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: text, encoding: "utf-8" }),
    });

    const tree = await api<{ sha: string }>(token, `${root}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }],
      }),
    });

    if (tree.sha === commit.tree.sha) return;

    const next = await api<{ sha: string }>(token, `${root}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: "Update wedding planner data",
        tree: tree.sha,
        parents: [parent],
      }),
    });

    const moved = await fetch(`${root}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: "PATCH",
      cache: "no-store",
      headers: headers(token),
      body: JSON.stringify({ sha: next.sha, force: false }),
    });

    if (moved.ok) return;
    if (moved.status === 422 && attempt < 3) continue;
    const detail = await moved.text();
    throw new Error(`Could not update main (${moved.status}). ${detail.slice(0, 160)}`);
  }
}
