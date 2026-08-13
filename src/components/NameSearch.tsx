import { useMemo, useState } from "react";
import { RSVP_LABELS } from "../constants";
import type { Guest } from "../types";

export function NameSearch({
  guests,
  excludeIds,
  onPick,
  onOpenChange,
  autoFocus = false,
  placeholder = "Start typing a name…",
}: {
  guests: Guest[];
  excludeIds?: string[];
  onPick: (guestId: string) => void;
  onOpenChange?: (open: boolean) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(autoFocus);
  const excluded = excludeIds ?? [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return guests
      .filter((guest) => !excluded.includes(guest.id))
      .filter((guest) => [guest.name, guest.group].join(" ").toLowerCase().includes(q))
      .slice(0, 8);
  }, [excluded, guests, query]);

  function setMenu(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function pick(guest: Guest) {
    onPick(guest.id);
    setQuery("");
    setMenu(false);
  }

  return (
    <div className="relative">
      <input
        className="field"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setMenu(true);
        }}
        onFocus={() => setMenu(true)}
        onBlur={() => {
          window.setTimeout(() => setMenu(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            e.preventDefault();
            pick(matches[0]);
          }
          if (e.key === "Escape") setMenu(false);
        }}
      />
      {open && query.trim() ? (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-gold/20 bg-cream py-1 shadow-paper">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No guest matches that name.</li>
          ) : (
            matches.map((guest) => (
              <li key={guest.id}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gold-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(guest)}
                >
                  <span>
                    {guest.name}
                    {guest.group ? <span className="ml-2 text-xs text-muted">{guest.group}</span> : null}
                  </span>
                  {guest.rsvp !== "attending" ? (
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-muted">
                      {RSVP_LABELS[guest.rsvp]}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
