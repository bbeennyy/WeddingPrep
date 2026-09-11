import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { NameSearch } from "../components/NameSearch";
import { EmptyState } from "../components/Ui";
import { useWedding } from "../context";
import { coupleLabel, uid } from "../defaults";
import { printTarget } from "../print";
import type { Guest, PhotoShot } from "../types";

const GROUP_TINTS = [
  { bg: "#f4ead8", border: "#d4b87a", accent: "#b0894f" },
  { bg: "#e5eee2", border: "#a8bfa0", accent: "#5c7356" },
  { bg: "#f4e6e8", border: "#d4a8b0", accent: "#a85c66" },
  { bg: "#d9e1ea", border: "#a8b8cc", accent: "#6d7f96" },
  { bg: "#eadcec", border: "#c4a8d0", accent: "#9a7aa8" },
];

export function PhotoShotsPanel() {
  const { data, patch } = useWedding();

  const invited = data.guests.filter((guest) => guest.rsvp !== "declined");
  const assigned = new Set(data.photoShots.flatMap((shot) => shot.guestIds));
  const unassignedCount = invited.filter((guest) => !assigned.has(guest.id)).length;

  function addShot() {
    const next: PhotoShot = {
      id: uid(),
      name: `Photo ${data.photoShots.length + 1}`,
      notes: "",
      guestIds: [],
    };
    patch("photoShots", [...data.photoShots, next]);
  }

  function updateShot(id: string, next: Partial<PhotoShot>) {
    patch(
      "photoShots",
      data.photoShots.map((shot) => (shot.id === id ? { ...shot, ...next } : shot)),
    );
  }

  function addGuest(shotId: string, guestId: string) {
    patch(
      "photoShots",
      data.photoShots.map((shot) =>
        shot.id === shotId && !shot.guestIds.includes(guestId)
          ? { ...shot, guestIds: [...shot.guestIds, guestId] }
          : shot,
      ),
    );
  }

  function removeGuest(shotId: string, guestId: string) {
    patch(
      "photoShots",
      data.photoShots.map((shot) =>
        shot.id === shotId ? { ...shot, guestIds: shot.guestIds.filter((id) => id !== guestId) } : shot,
      ),
    );
  }

  function peopleIn(shot: PhotoShot): Guest[] {
    return shot.guestIds
      .map((id) => invited.find((guest) => guest.id === id))
      .filter((guest): guest is Guest => Boolean(guest));
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Type a name in the Add people box on a card — not the photo title. Anyone who has not declined can be added.
          The same person can be in more than one picture.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => printTarget("photos")}>
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <button className="btn-primary" onClick={addShot}>
            <Plus className="h-4 w-4" /> Add photo
          </button>
        </div>
      </div>

      <p className="no-print text-sm text-muted">
        {invited.length === 0
          ? "Add guests first, then type their names into a photo card."
          : unassignedCount === 0
            ? "Everyone on the list is in at least one photo."
            : `${unassignedCount} ${unassignedCount === 1 ? "guest is" : "guests are"} not in a photo yet.`}
      </p>

      {data.photoShots.length === 0 ? (
        <div className="no-print">
          <EmptyState
            title="No photo groups yet"
            body="Add groups like family, wedding party, and friends, then type names into each card."
          />
        </div>
      ) : (
        <div className="no-print grid items-start gap-4 md:grid-cols-2">
          {data.photoShots.map((shot) => {
            const people = peopleIn(shot);
            return (
              <ShotCard
                key={shot.id}
                shot={shot}
                people={people}
                invited={invited}
                onChange={(next) => updateShot(shot.id, next)}
                onAdd={(guestId) => addGuest(shot.id, guestId)}
                onRemove={(guestId) => removeGuest(shot.id, guestId)}
                onDelete={() => patch("photoShots", data.photoShots.filter((row) => row.id !== shot.id))}
              />
            );
          })}
        </div>
      )}

      <PhotoShotList
        names={coupleLabel(data.settings)}
        date={data.settings.weddingDate}
        venue={[data.settings.churchName, data.settings.receptionVenue, data.settings.city].filter(Boolean).join(" · ")}
        shots={data.photoShots.map((shot) => ({
          id: shot.id,
          name: shot.name,
          notes: shot.notes,
          people: peopleIn(shot).map((guest) => guest.name),
        }))}
      />
    </div>
  );
}

function ShotCard({
  shot,
  people,
  invited,
  onChange,
  onAdd,
  onRemove,
  onDelete,
}: {
  shot: PhotoShot;
  people: Guest[];
  invited: Guest[];
  onChange: (next: Partial<PhotoShot>) => void;
  onAdd: (guestId: string) => void;
  onRemove: (guestId: string) => void;
  onDelete: () => void;
}) {
  const [searching, setSearching] = useState(false);

  return (
    <article className={`card overflow-visible p-4 ${searching ? "relative z-20" : ""}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <input className="field" value={shot.name} onChange={(e) => onChange({ name: e.target.value })} />
          <input
            className="field"
            placeholder="Where / when (church steps, after the ceremony…)"
            value={shot.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
        <button className="btn-ghost !px-2 text-rose" onClick={onDelete} aria-label="Remove photo group">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <label className="label">Add people</label>
      <NameSearch
        guests={invited}
        excludeIds={shot.guestIds}
        onPick={onAdd}
        onOpenChange={setSearching}
      />
      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
        {people.length} {people.length === 1 ? "person" : "people"}
      </p>
      {people.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {people.map((guest) => (
            <li key={guest.id} className="flex items-center justify-between gap-2">
              <span>{guest.name}</span>
              <button className="text-xs text-muted hover:text-rose" onClick={() => onRemove(guest.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function PhotoShotList({
  names,
  date,
  venue,
  shots,
}: {
  names: string;
  date: string;
  venue: string;
  shots: { id: string; name: string; notes: string; people: string[] }[];
}) {
  const printable = shots.filter((shot) => shot.people.length || shot.name.trim());

  return (
    <article
      className="print-only print-target print-sheet mx-auto max-w-3xl bg-white px-8 py-12"
      data-print-id="photos"
    >
      <p className="text-center text-[11px] uppercase tracking-[0.28em] text-gold">Photographer shot list</p>
      <h2 className="mt-3 text-center font-serif text-4xl italic">{names}</h2>
      <p className="mt-3 text-center text-sm text-muted">
        {[date && new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }), venue]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        {printable.length} groups · declined guests left off
      </p>
      <div className="mx-auto my-8 h-px w-24 bg-gold/50" />
      {printable.length === 0 ? (
        <p className="text-center text-sm text-muted">No photo groups yet.</p>
      ) : (
        <ol className="space-y-4">
          {printable.map((shot, index) => {
            const tint = GROUP_TINTS[index % GROUP_TINTS.length];
            const columns =
              shot.people.length >= 12 ? 3 : shot.people.length >= 4 ? 2 : 1;
            return (
              <li
                key={shot.id}
                className="print-break overflow-hidden rounded-2xl border"
                style={{ backgroundColor: tint.bg, borderColor: tint.border }}
              >
                <div
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3"
                  style={{ borderColor: tint.border }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: tint.accent }}
                    >
                      Group {index + 1}
                    </p>
                    <h3 className="mt-0.5 font-serif text-2xl leading-tight text-ink">
                      {shot.name || "Untitled photo"}
                    </h3>
                    {shot.notes ? (
                      <p className="mt-1 text-sm italic text-muted">{shot.notes}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-xs uppercase tracking-[0.14em] text-muted">
                    {shot.people.length} {shot.people.length === 1 ? "person" : "people"}
                  </p>
                </div>
                {shot.people.length ? (
                  <ul
                    className="gap-x-4 gap-y-1 px-4 py-3 text-sm text-ink"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                  >
                    {shot.people.map((name, personIndex) => (
                      <li key={`${shot.id}-${personIndex}`} className="truncate py-0.5">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted">No guests assigned yet.</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
