import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { NameSearch } from "../components/NameSearch";
import { EmptyState } from "../components/Ui";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
import type { Guest, Owner, Table, TableShape } from "../types";

export function TablesPage() {
  const { data, patch } = useWedding();
  const seatable = data.guests.filter((guest) => guest.rsvp !== "declined");
  const unseated = seatable.filter((guest) => !guest.tableId);

  function addTable() {
    const next: Table = {
      id: uid(),
      name: `Table ${data.tables.length + 1}`,
      seats: 8,
      shape: "round",
    };
    patch("tables", [...data.tables, next]);
  }

  function updateTable(id: string, next: Partial<Table>) {
    patch(
      "tables",
      data.tables.map((table) => (table.id === id ? { ...table, ...next } : table)),
    );
  }

  function seat(guestId: string, tableId: string | null) {
    patch(
      "guests",
      data.guests.map((guest) => (guest.id === guestId ? { ...guest, tableId } : guest)),
    );
  }

  function removeTable(id: string) {
    patch("tables", data.tables.filter((table) => table.id !== id));
    patch(
      "guests",
      data.guests.map((guest) => (guest.tableId === id ? { ...guest, tableId: null } : guest)),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Table formations</h1>
          <p className="mt-1 text-sm text-muted">
            Tap an empty seat, then type a name. Declined guests stay off the list.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-navy bg-navy-soft" />
              {ownerName(data.settings, "a")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-mov bg-mov-soft" />
              {ownerName(data.settings, "b")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-gold bg-gold-soft" />
              Together
            </span>
          </div>
        </div>
        <button className="btn-primary" onClick={addTable}>
          <Plus className="h-4 w-4" /> Add table
        </button>
      </div>

      <section className="card p-4">
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Unseated guests</h2>
        {unseated.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {seatable.length === 0
              ? "Add guests first, then tap a seat and type a name."
              : "Everyone who can be seated has a place."}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {unseated.length} still need a seat. Tap an empty spot on a table and start typing.
          </p>
        )}
      </section>

      {data.tables.length === 0 ? (
        <EmptyState title="No tables yet" body="Add round or long tables, then tap a seat and type who sits there." />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {data.tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              guests={data.guests.filter((guest) => guest.tableId === table.id)}
              candidates={unseated}
              onSeat={(guestId) => seat(guestId, table.id)}
              onUnseat={(guestId) => seat(guestId, null)}
              onChange={(next) => updateTable(table.id, next)}
              onDelete={() => removeTable(table.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TableCard({
  table,
  guests,
  candidates,
  onSeat,
  onUnseat,
  onChange,
  onDelete,
}: {
  table: Table;
  guests: Guest[];
  candidates: Guest[];
  onSeat: (guestId: string) => void;
  onUnseat: (guestId: string) => void;
  onChange: (next: Partial<Table>) => void;
  onDelete: () => void;
}) {
  const [pickingSeat, setPickingSeat] = useState<number | null>(null);

  const seats = useMemo(() => {
    const list: Array<Guest | null> = [...guests];
    while (list.length < table.seats) list.push(null);
    return list.slice(0, table.seats);
  }, [guests, table.seats]);

  const over = guests.length > table.seats;

  return (
    <article className={`card overflow-visible p-4 ${pickingSeat !== null ? "relative z-20" : ""}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="grid flex-1 grid-cols-2 gap-2">
          <input className="field" value={table.name} onChange={(e) => onChange({ name: e.target.value })} />
          <input
            className="field"
            type="number"
            min={2}
            max={16}
            value={table.seats}
            onChange={(e) => onChange({ seats: Math.max(2, Number(e.target.value) || 2) })}
          />
          <select
            className="field"
            value={table.shape}
            onChange={(e) => onChange({ shape: e.target.value as TableShape })}
          >
            <option value="round">Round</option>
            <option value="rect">Long table</option>
          </select>
        </div>
        <button className="btn-ghost !px-2 text-rose" onClick={onDelete} aria-label="Remove table">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mx-auto aspect-square max-w-[16rem]">
        <div
          className={`absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-sage bg-sage-soft text-center text-sm font-medium text-sage ${
            table.shape === "round" ? "rounded-full" : "rounded-lg"
          }`}
        >
          {guests.length}/{table.seats}
          {over ? " over" : ""}
        </div>
        {seats.map((guest, index) => {
          const angle = (index / table.seats) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + 42 * Math.cos(angle);
          const y = 50 + 42 * Math.sin(angle);
          const picking = pickingSeat === index;
          const colors = guest ? sideColors(guest.side) : picking ? pickingColors : emptyColors;
          return (
            <button
              key={guest?.id ?? `empty-${index}`}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full text-[11px] font-semibold leading-tight"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                backgroundColor: colors.fill,
                border: `2px ${guest || picking ? "solid" : "dashed"} ${colors.line}`,
                color: colors.text,
              }}
              title={guest?.name ?? "Empty seat"}
              onClick={() => {
                if (guest) {
                  onUnseat(guest.id);
                  setPickingSeat(null);
                } else {
                  setPickingSeat(picking ? null : index);
                }
              }}
            >
              {guest ? initials(guest.name) : picking ? "+" : ""}
            </button>
          );
        })}
      </div>

      {pickingSeat !== null ? (
        <div className="mt-4">
          <label className="label">Seat this person</label>
          <NameSearch
            key={pickingSeat}
            guests={candidates}
            autoFocus
            placeholder="Start typing a name…"
            onPick={(guestId) => {
              onSeat(guestId);
              setPickingSeat(null);
            }}
          />
          <button className="mt-2 text-xs text-muted underline" onClick={() => setPickingSeat(null)}>
            Cancel
          </button>
        </div>
      ) : null}

      <ul className="mt-4 space-y-1 text-sm">
        {guests.map((guest) => (
          <li key={guest.id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sideColors(guest.side).line }} />
              <span>{guest.name}</span>
            </span>
            <button className="text-xs text-muted hover:text-rose" onClick={() => onUnseat(guest.id)}>
              Unseat
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

const emptyColors = { fill: "#fbf8f1", line: "#c4b59a", text: "#7a7266" };
const pickingColors = { fill: "#ead9b8", line: "#b0894f", text: "#2b261f" };

function sideColors(side: Owner): { fill: string; line: string; text: string } {
  if (side === "a") return { fill: "#d9e1ea", line: "#6d7f96", text: "#3d4f66" };
  if (side === "b") return { fill: "#eadcec", line: "#9a7aa8", text: "#5c4568" };
  return { fill: "#f4ead8", line: "#b0894f", text: "#7a5c32" };
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
