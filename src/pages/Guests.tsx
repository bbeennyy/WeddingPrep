import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { RSVP_LABELS } from "../constants";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
import { parseGuestCsv } from "../storage";
import type { Guest, Owner, Rsvp } from "../types";
import { EmptyState, Modal } from "../components/Ui";

const emptyGuest = (): Guest => ({
  id: uid(),
  name: "",
  side: "both",
  rsvp: "pending",
  dietary: "",
  notes: "",
  tableId: null,
  group: "",
  rehearsalDinner: false,
});

type GuestTab = "wedding" | "rehearsal";

function withRsvp(guest: Guest, rsvp: Rsvp): Guest {
  return {
    ...guest,
    rsvp,
    rehearsalDinner: rsvp === "attending" ? guest.rehearsalDinner : false,
  };
}

export function GuestsPage() {
  const { data, patch } = useWedding();
  const csvRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<GuestTab>("wedding");
  const [query, setQuery] = useState("");
  const [rsvp, setRsvp] = useState<"all" | Rsvp>("all");
  const [draft, setDraft] = useState<Guest | null>(null);
  const [importStatus, setImportStatus] = useState("");

  const attending = useMemo(
    () => data.guests.filter((guest) => guest.rsvp === "attending"),
    [data.guests],
  );
  const rehearsalInvited = attending.filter((guest) => guest.rehearsalDinner);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = tab === "rehearsal" ? attending : data.guests;
    return source.filter((guest) => {
      if (tab === "wedding" && rsvp !== "all" && guest.rsvp !== rsvp) return false;
      if (!q) return true;
      return [guest.name, guest.group, guest.dietary, guest.notes].join(" ").toLowerCase().includes(q);
    });
  }, [attending, data.guests, query, rsvp, tab]);

  const counts = {
    all: data.guests.length,
    attending: attending.length,
    pending: data.guests.filter((g) => g.rsvp === "pending").length,
    declined: data.guests.filter((g) => g.rsvp === "declined").length,
    maybe: data.guests.filter((g) => g.rsvp === "maybe").length,
  };

  function saveGuest(guest: Guest) {
    if (!guest.name.trim()) return;
    const next = withRsvp({ ...guest, name: guest.name.trim() }, guest.rsvp);
    const exists = data.guests.some((row) => row.id === guest.id);
    patch("guests", exists ? data.guests.map((row) => (row.id === guest.id ? next : row)) : [...data.guests, next]);
    setDraft(null);
  }

  function setGuestRsvp(id: string, next: Rsvp) {
    patch(
      "guests",
      data.guests.map((row) => (row.id === id ? withRsvp(row, next) : row)),
    );
  }

  function toggleRehearsal(id: string, invited: boolean) {
    patch(
      "guests",
      data.guests.map((row) =>
        row.id === id && row.rsvp === "attending" ? { ...row, rehearsalDinner: invited } : row,
      ),
    );
  }

  async function importCsv(file: File) {
    setImportStatus("");
    try {
      const imported = parseGuestCsv(await file.text());
      const existing = new Set(data.guests.map((guest) => guest.name.trim().toLowerCase()));
      const fresh = imported.filter((guest) => !existing.has(guest.name.trim().toLowerCase()));
      const skipped = imported.length - fresh.length;
      if (fresh.length === 0) {
        setImportStatus(
          imported.length === 0
            ? "No guests found. Use columns A first name, B last name, C party, with names starting on row 2."
            : "Those names are already on the list.",
        );
        return;
      }
      patch("guests", [...data.guests, ...fresh]);
      setImportStatus(
        skipped
          ? `Added ${fresh.length} guests. ${skipped} already on the list were skipped. RSVP is Pending until you change it.`
          : `Added ${fresh.length} guests. RSVP is Pending until you change it.`,
      );
    } catch {
      setImportStatus("That CSV could not be read.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">{tab === "rehearsal" ? "Rehearsal dinner" : "Guest list"}</h1>
          <p className="mt-1 text-sm text-muted">
            {tab === "rehearsal"
              ? `${rehearsalInvited.length} of ${attending.length} attending guests invited`
              : `${counts.attending} attending · ${counts.pending} pending · ${counts.declined} declined`}
          </p>
        </div>
        {tab === "wedding" ? (
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => csvRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv,.tsv,text/tab-separated-values"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) await importCsv(file);
              }}
            />
            <button className="btn-primary" onClick={() => setDraft(emptyGuest())}>
              <Plus className="h-4 w-4" /> Add guest
            </button>
          </div>
        ) : null}
      </div>
      {importStatus && tab === "wedding" ? <p className="text-sm text-muted">{importStatus}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          className={tab === "wedding" ? "btn-primary !py-1" : "btn-ghost !py-1"}
          onClick={() => setTab("wedding")}
        >
          Wedding
        </button>
        <button
          className={tab === "rehearsal" ? "btn-primary !py-1" : "btn-ghost !py-1"}
          onClick={() => setTab("rehearsal")}
        >
          Rehearsal dinner
        </button>
      </div>

      {tab === "wedding" ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {(["all", "attending", "pending", "declined"] as const).map((key) => (
            <button
              key={key}
              className={`card px-4 py-3 text-left ${rsvp === key ? "ring-1 ring-gold/40" : ""}`}
              onClick={() => setRsvp(key)}
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{key}</p>
              <p className="font-serif text-3xl">{counts[key]}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Invited</p>
            <p className="font-serif text-3xl">{rehearsalInvited.length}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Not invited yet</p>
            <p className="font-serif text-3xl">{attending.length - rehearsalInvited.length}</p>
          </div>
        </div>
      )}

      <input
        className="field"
        placeholder={tab === "rehearsal" ? "Search attending guests…" : "Search names, families, dietary notes…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === "rehearsal" ? "No attending guests yet" : "No guests yet"}
          body={
            tab === "rehearsal"
              ? "Mark people as attending on the Wedding tab first. Only those names can be invited to the rehearsal dinner."
              : "Import a CSV (first name, last name, party) or add people as you think of them. RSVP stays Pending until you mark attending or declined."
          }
        />
      ) : tab === "rehearsal" ? (
        <div className="card divide-y divide-gold/10 overflow-hidden">
          {filtered.map((guest) => (
            <label key={guest.id} className="flex items-start gap-3 px-4 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-sage"
                checked={guest.rehearsalDinner}
                onChange={(e) => toggleRehearsal(guest.id, e.target.checked)}
              />
              <span className="min-w-0 flex-1">
                <p className="text-sm font-medium">{guest.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {ownerName(data.settings, guest.side)}
                  {guest.group ? ` · ${guest.group}` : ""}
                  {guest.dietary ? ` · ${guest.dietary}` : ""}
                </p>
              </span>
              <span className="mt-0.5 text-xs text-muted">{guest.rehearsalDinner ? "Invited" : "Not invited"}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-gold/10 overflow-hidden">
          {filtered.map((guest) => (
            <div key={guest.id} className="flex items-start gap-3 px-4 py-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => setDraft(guest)}>
                <p className="text-sm font-medium">{guest.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {ownerName(data.settings, guest.side)}
                  {guest.group ? ` · ${guest.group}` : ""}
                  {guest.dietary ? ` · ${guest.dietary}` : ""}
                  {guest.rsvp === "attending" && guest.rehearsalDinner ? " · rehearsal dinner" : ""}
                </p>
              </button>
              <select
                className="field max-w-[8.5rem]"
                value={guest.rsvp}
                onChange={(e) => setGuestRsvp(guest.id, e.target.value as Rsvp)}
              >
                {(Object.keys(RSVP_LABELS) as Rsvp[]).map((key) => (
                  <option key={key} value={key}>
                    {RSVP_LABELS[key]}
                  </option>
                ))}
              </select>
              <button
                className="mt-2 text-muted hover:text-rose"
                aria-label="Delete guest"
                onClick={() => patch("guests", data.guests.filter((row) => row.id !== guest.id))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {draft ? (
        <Modal title={draft.name || "Guest"} onClose={() => setDraft(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Side</label>
                <select className="field" value={draft.side} onChange={(e) => setDraft({ ...draft, side: e.target.value as Owner })}>
                  <option value="a">{ownerName(data.settings, "a")}</option>
                  <option value="b">{ownerName(data.settings, "b")}</option>
                  <option value="both">Both / shared</option>
                </select>
              </div>
              <div>
                <label className="label">RSVP</label>
                <select
                  className="field"
                  value={draft.rsvp}
                  onChange={(e) => setDraft(withRsvp(draft, e.target.value as Rsvp))}
                >
                  {(Object.keys(RSVP_LABELS) as Rsvp[]).map((key) => (
                    <option key={key} value={key}>
                      {RSVP_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Family / group</label>
              <input className="field" value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value })} />
            </div>
            <div>
              <label className="label">Dietary</label>
              <input className="field" value={draft.dietary} onChange={(e) => setDraft({ ...draft, dietary: e.target.value })} />
            </div>
            {draft.rsvp === "attending" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-sage"
                  checked={draft.rehearsalDinner}
                  onChange={(e) => setDraft({ ...draft, rehearsalDinner: e.target.checked })}
                />
                Invited to the rehearsal dinner
              </label>
            ) : (
              <p className="text-xs text-muted">Mark them attending to invite them to the rehearsal dinner.</p>
            )}
            <div>
              <label className="label">Notes</label>
              <textarea className="field min-h-20" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
            <button className="btn-primary w-full" onClick={() => saveGuest(draft)}>
              Save guest
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
