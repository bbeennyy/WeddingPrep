import { useRef, useState } from "react";
import { useWedding } from "../context";
import { createDefaultData } from "../defaults";
import { downloadData, hasGithubTarget, parseWeddingData } from "../storage";

export function SettingsPage() {
  const { data, patch, setData, setGithubToken, syncState, syncMessage, syncNow, refreshFromGithub } = useWedding();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const syncOn = hasGithubTarget(settings);

  function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    patch("settings", { ...settings, [key]: value });
  }

  async function pull() {
    setBusy(true);
    setStatus("");
    try {
      await refreshFromGithub();
      setStatus("Loaded the shared file from GitHub.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load from GitHub.");
    } finally {
      setBusy(false);
    }
  }

  async function push() {
    setBusy(true);
    setStatus("");
    try {
      await syncNow();
      setStatus("Saved to GitHub. Open the site on the other phone to pick it up.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save to GitHub.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your names, the date, and how you share this planner.</p>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="font-serif text-2xl">The two of you</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Beniamin</label>
            <input className="field" value={settings.partnerA} onChange={(e) => update("partnerA", e.target.value)} />
          </div>
          <div>
            <label className="label">Evelyn</label>
            <input className="field" value={settings.partnerB} onChange={(e) => update("partnerB", e.target.value)} />
          </div>
          <div>
            <label className="label">Wedding date</label>
            <input className="field" type="date" value={settings.weddingDate} onChange={(e) => update("weddingDate", e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="field" value={settings.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div>
            <label className="label">Church</label>
            <input className="field" value={settings.churchName} onChange={(e) => update("churchName", e.target.value)} />
          </div>
          <div>
            <label className="label">Reception</label>
            <input className="field" value={settings.receptionVenue} onChange={(e) => update("receptionVenue", e.target.value)} />
          </div>
          <div>
            <label className="label">Currency symbol</label>
            <input className="field max-w-[6rem]" value={settings.currency} onChange={(e) => update("currency", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-serif text-2xl">Share the JSON</h2>
        <p className="text-sm text-muted">
          The PIN only opens the site. To share checks with each other, this phone needs one GitHub write key so it can
          commit <code>data/wedding.json</code>. Paste it once. After that, ticking a task uploads the file.
        </p>
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            syncState === "error"
              ? "bg-rose-50 text-rose-900"
              : syncOn
                ? "bg-sage/10 text-ink"
                : "bg-gold/10 text-ink"
          }`}
        >
          {syncOn
            ? syncMessage || "Uploads are on. Checks commit wedding.json."
            : "Uploads are off on this phone until you paste the write key."}
        </p>
        <div>
          <label className="label">Write key (once per phone)</label>
          <input
            className="field"
            type="password"
            autoComplete="off"
            value={settings.githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="github_pat_…"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-sage" disabled={busy || !syncOn} onClick={push}>
            Upload JSON now
          </button>
          <button className="btn-ghost" disabled={busy} onClick={pull}>
            Load JSON now
          </button>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-serif text-2xl">Backup file</h2>
        <p className="text-sm text-muted">
          Download a JSON copy, or import one from your PC if you have not set up the token yet.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => downloadData(data)}>
            Download JSON
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                const parsed = parseWeddingData(JSON.parse(await file.text()));
                parsed.settings.githubToken = settings.githubToken;
                setData(parsed);
                setStatus("Imported. Your previous data in this browser was replaced.");
              } catch {
                setStatus("That file could not be read.");
              }
            }}
          />
        </div>
      </section>

      {status ? <p className="text-sm text-sage">{status}</p> : null}

      <section className="card space-y-3 p-5">
        <h2 className="font-serif text-2xl">Reset</h2>
        <p className="text-sm text-muted">This clears this browser and restores the starter checklist and Presbyterian-style program.</p>
        <button
          className="btn-ghost text-rose"
          onClick={() => {
            if (confirm("Reset all wedding data in this browser?")) {
              const next = createDefaultData();
              next.settings.githubToken = settings.githubToken;
              setData(next);
            }
          }}
        >
          Reset planner
        </button>
      </section>
    </div>
  );
}
