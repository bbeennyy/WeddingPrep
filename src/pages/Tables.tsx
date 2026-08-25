import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { NameSearch } from "../components/NameSearch";
import { EmptyState } from "../components/Ui";
import { useWedding } from "../context";
import { ownerName, uid } from "../defaults";
import type { Guest, Owner, Table, TableShape } from "../types";

export function TablesPage() {
  const { data, patch } = useWedding();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const attending = data.guests.filter((guest) => guest.rsvp === "attending");
  const unseated = attending.filter((guest) => !guest.tableId);
  const selected = unseated.find((guest) => guest.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unseated;
    return unseated.filter((guest) => [guest.name, guest.group].join(" ").toLowerCase().includes(q));
  }, [query, unseated]);

  const bySide = (
    [
      { side: "a" as const, label: ownerName(data.settings, "a"), guests: filtered.filter((guest) => guest.side === "a") },
      { side: "b" as const, label: ownerName(data.settings, "b"), guests: filtered.filter((guest) => guest.side === "b") },
      { side: "both" as const, label: "Together", guests: filtered.filter((guest) => guest.side === "both") },
    ] satisfies Array<{ side: Owner; label: string; guests: Guest[] }>
  ).filter((group) => group.guests.length > 0);

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
            Pick a name on the side, then tap an empty seat. Only people marked attending show up here.
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

      {selected ? (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: sideColors(selected.side).fill }}>
          Seating <strong>{selected.name}</strong> — tap an empty seat, or{" "}
          <button className="underline" onClick={() => setSelectedId(null)}>
            cancel
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="card order-1 max-h-[40vh] overflow-hidden p-0 lg:sticky lg:top-24 lg:order-2 lg:w-72 lg:shrink-0 lg:max-h-[calc(100vh-8rem)]">
          <div className="border-b border-gold/15 px-4 py-3">
            <h2 className="text-xs uppercase tracking-[0.16em] text-muted">Available to seat</h2>
            <p className="mt-1 text-sm text-ink">
              {unseated.length} attending {unseated.length === 1 ? "guest" : "guests"} not seated yet
            </p>
            <input
              className="field mt-3"
              placeholder="Filter names…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[calc(40vh-7rem)] overflow-y-auto p-3 lg:max-h-[calc(100vh-14rem)]">
            {attending.length === 0 ? (
              <p className="px-1 py-6 text-sm text-muted">Mark people as attending on the Guests page first.</p>
            ) : unseated.length === 0 ? (
              <p className="px-1 py-6 text-sm text-muted">Every attending guest has a seat.</p>
            ) : filtered.length === 0 ? (
              <p className="px-1 py-6 text-sm text-muted">No names match that filter.</p>
            ) : (
              <div className="space-y-4">
                {bySide.map((group) => (
                  <section key={group.side}>
                    <h3 className="mb-2 flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.14em] text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: sideColors(group.side).line }}
                      />
                      {group.label}
                    </h3>
                    <ul className="space-y-1">
                      {group.guests
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((guest) => {
                          const colors = sideColors(guest.side);
                          const active = selectedId === guest.id;
                          return (
                            <li key={guest.id}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm"
                                style={{
                                  backgroundColor: active ? colors.line : colors.fill,
                                  color: active ? "#fbf8f1" : colors.text,
                                }}
                                onClick={() => setSelectedId(active ? null : guest.id)}
                              >
                                <span
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: active ? colors.fill : "#fff",
                                    color: colors.text,
                                    border: `2px solid ${colors.line}`,
                                  }}
                                >
                                  {initials(guest.name)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">{guest.name}</span>
                                  {guest.group ? (
                                    <span className={`block truncate text-xs ${active ? "text-cream/80" : "opacity-70"}`}>
                                      {guest.group}
                                    </span>
                                  ) : null}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="order-2 min-w-0 flex-1 space-y-4 lg:order-1">
          {data.tables.length === 0 ? (
            <EmptyState title="No tables yet" body="Add round or long tables, then pick an attending guest and tap a seat." />
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2">
              {data.tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  guests={data.guests.filter((guest) => guest.tableId === table.id)}
                  candidates={unseated}
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
      </div>
    </div>
  );
}

function TableCard({
  table,
  guests,
  candidates,
  selected,
  onSeat,
  onUnseat,
  onChange,
  onDelete,
}: {
  table: Table;
  guests: Guest[];
  candidates: Guest[];
  selected: Guest | null;
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
    <article className={`card overflow-visible p-4 ${pickingSeat !== null || selected ? "relative z-20" : ""}`}>
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
          const colors = guest ? sideColors(guest.side) : picking || selected ? pickingColors : emptyColors;
          return (
            <button
              key={guest?.id ?? `empty-${index}`}
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full text-[11px] font-semibold leading-tight"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                backgroundColor: colors.fill,
                border: `2px ${guest || picking || selected ? "solid" : "dashed"} ${colors.line}`,
                color: colors.text,
              }}
              title={guest?.name ?? "Empty seat"}
              onClick={() => {
                if (guest) {
                  onUnseat(guest.id);
                  setPickingSeat(null);
                  return;
                }
                if (selected) {
                  onSeat(selected.id);
                  setPickingSeat(null);
                  return;
                }
                setPickingSeat(picking ? null : index);
              }}
            >
              {guest ? initials(guest.name) : picking ? "+" : ""}
            </button>
          );
        })}
      </div>

      {pickingSeat !== null && !selected ? (
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
