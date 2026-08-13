import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useWedding } from "../context";
import { uid } from "../defaults";
import type { Guest, Table, TableShape } from "../types";
import { EmptyState } from "../components/Ui";

export function TablesPage() {
  const { data, patch } = useWedding();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const attending = data.guests.filter((guest) => guest.rsvp === "attending" || guest.rsvp === "maybe");
  const unseated = attending.filter((guest) => !guest.tableId);
  const selected = attending.find((guest) => guest.id === selectedId) ?? null;

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
    setSelectedId(null);
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
            Tap a guest, then tap a table to seat them. Only attending / maybe guests appear here.
          </p>
        </div>
        <button className="btn-primary" onClick={addTable}>
          <Plus className="h-4 w-4" /> Add table
        </button>
      </div>

      {selected ? (
        <div className="rounded-2xl bg-gold-soft px-4 py-3 text-sm">
          Seating <strong>{selected.name}</strong> — tap a table, or{" "}
          <button className="underline" onClick={() => setSelectedId(null)}>
            cancel
          </button>
        </div>
      ) : null}

      <section className="card p-4">
        <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Unseated guests</h2>
        {unseated.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {attending.length === 0
              ? "Mark people as attending on the Guests page first."
              : "Everyone who is coming has a seat."}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {unseated.map((guest) => (
              <button
                key={guest.id}
                className={`rounded-full border px-3 py-1 text-sm ${
                  selectedId === guest.id ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white"
                }`}
                onClick={() => setSelectedId(guest.id === selectedId ? null : guest.id)}
              >
                {guest.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {data.tables.length === 0 ? (
        <EmptyState title="No tables yet" body="Add round or long tables, then seat the people who are coming." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              guests={data.guests.filter((guest) => guest.tableId === table.id)}
              selected={selected}
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
  selected,
  onSeat,
  onUnseat,
  onChange,
  onDelete,
}: {
  table: Table;
  guests: Guest[];
  selected: Guest | null;
  onSeat: (guestId: string) => void;
  onUnseat: (guestId: string) => void;
  onChange: (next: Partial<Table>) => void;
  onDelete: () => void;
}) {
  const seats = useMemo(() => {
    const list: Array<Guest | null> = [...guests];
    while (list.length < table.seats) list.push(null);
    return list.slice(0, table.seats);
  }, [guests, table.seats]);

  const over = guests.length > table.seats;

  return (
    <article
      className={`card p-4 ${selected ? "cursor-pointer ring-1 ring-gold/50" : ""}`}
      onClick={() => {
        if (selected) onSeat(selected.id);
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2" onClick={(e) => e.stopPropagation()}>
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
          className={`absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-sage-soft text-center text-xs text-sage ${
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
          return (
            <button
              key={guest?.id ?? `empty-${index}`}
              className={`absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border text-[10px] leading-tight ${
                guest ? "border-ink/20 bg-white" : "border-dashed border-ink/20 bg-white/40 text-muted"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={guest?.name ?? "Empty seat"}
              onClick={(e) => {
                e.stopPropagation();
                if (guest) onUnseat(guest.id);
                else if (selected) onSeat(selected.id);
              }}
            >
              {guest ? initials(guest.name) : "·"}
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-1 text-sm" onClick={(e) => e.stopPropagation()}>
        {guests.map((guest) => (
          <li key={guest.id} className="flex items-center justify-between gap-2">
            <span>{guest.name}</span>
            <button className="text-xs text-muted hover:text-rose" onClick={() => onUnseat(guest.id)}>
              Unseat
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
