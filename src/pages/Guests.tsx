import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RSVP_LABELS } from "../constants";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
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
});

export function GuestsPage() {
  const { data, patch } = useWedding();
  const [query, setQuery] = useState("");
  const [rsvp, setRsvp] = useState<"all" | Rsvp>("all");
  const [draft, setDraft] = useState<Guest | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.guests.filter((guest) => {
      if (rsvp !== "all" && guest.rsvp !== rsvp) return false;
      if (!q) return true;
      return [guest.name, guest.group, guest.dietary, guest.notes].join(" ").toLowerCase().includes(q);
    });
  }, [data.guests, query, rsvp]);

  const counts = {
    all: data.guests.length,
    attending: data.guests.filter((g) => g.rsvp === "attending").length,
    pending: data.guests.filter((g) => g.rsvp === "pending").length,
    declined: data.guests.filter((g) => g.rsvp === "declined").length,
    maybe: data.guests.filter((g) => g.rsvp === "maybe").length,
  };

  function saveGuest(guest: Guest) {
    if (!guest.name.trim()) return;
    const exists = data.guests.some((row) => row.id === guest.id);
    patch("guests", exists ? data.guests.map((row) => (row.id === guest.id ? guest : row)) : [...data.guests, guest]);
    setDraft(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Guest list</h1>
          <p className="mt-1 text-sm text-muted">
            {counts.attending} attending · {counts.pending} pending · {counts.declined} declined
          </p>
        </div>
        <button className="btn-primary" onClick={() => setDraft(emptyGuest())}>
          <Plus className="h-4 w-4" /> Add guest
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["all", "attending", "pending", "declined"] as const).map((key) => (
          <button
            key={key}
            className={`card px-4 py-3 text-left ${rsvp === key || (key === "all" && rsvp === "all") ? "ring-1 ring-gold/40" : ""}`}
            onClick={() => setRsvp(key)}
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{key}</p>
            <p className="font-serif text-3xl">{counts[key]}</p>
          </button>
        ))}
      </div>

      <input
        className="field"
        placeholder="Search names, families, dietary notes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No guests yet"
          body="Add people as you think of them. Later you can mark who is coming and seat them at tables."
        />
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
                </p>
              </button>
              <select
                className="field max-w-[8.5rem]"
                value={guest.rsvp}
                onChange={(e) =>
                  patch(
                    "guests",
                    data.guests.map((row) =>
                      row.id === guest.id ? { ...row, rsvp: e.target.value as Rsvp } : row,
                    ),
                  )
                }
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
                <select className="field" value={draft.rsvp} onChange={(e) => setDraft({ ...draft, rsvp: e.target.value as Rsvp })}>
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
