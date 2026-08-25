import { Link } from "react-router-dom";
import { coupleLabel } from "../defaults";
import { useWedding } from "../context";

function daysUntil(dateValue: string): number | null {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - start.getTime()) / 86400000);
}

function Ring({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(100, Math.max(0, value)));
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#eadfcd" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="#5c7356"
          strokeWidth="7"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="font-serif text-xl leading-none">{pct}%</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const { data } = useWedding();
  const { settings, checklist, guests, program, tables } = data;
  const days = daysUntil(settings.weddingDate);
  const done = checklist.filter((item) => item.done).length;
  const attending = guests.filter((guest) => guest.rsvp === "attending").length;
  const pending = guests.filter((guest) => guest.rsvp === "pending").length;
  const seated = guests.filter((guest) => guest.tableId).length;
  const filledProgram = program.filter((item) => item.body.trim() || item.people.trim()).length;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden px-6 py-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">The wedding of</p>
        <h1 className="mt-3 font-serif text-5xl italic leading-tight sm:text-6xl">{coupleLabel(settings)}</h1>
        <p className="mt-4 text-muted">
          {[settings.weddingDate && new Date(`${settings.weddingDate}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }), settings.churchName, settings.city]
            .filter(Boolean)
            .join(" · ") || "Add your names and date in Settings"}
        </p>
        {days !== null ? (
          <p className="mt-6 font-serif text-3xl text-sage">
            {days > 0 ? `${days} days to go` : days === 0 ? "That’s today" : `${Math.abs(days)} days married`}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center justify-center py-6">
          <Ring value={checklist.length ? (done / checklist.length) * 100 : 0} label="Tasks done" />
        </div>
        <div className="card flex items-center justify-center py-6">
          <Ring
            value={guests.length ? (attending / guests.length) * 100 : 0}
            label="RSVPs attending"
          />
        </div>
        <div className="card flex items-center justify-center py-6">
          <Ring
            value={program.length ? (filledProgram / program.length) * 100 : 0}
            label="Day filled"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-serif text-2xl">Today’s snapshot</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>{done} of {checklist.length} preparation tasks done</li>
            <li>{guests.length} guests · {attending} attending · {pending} waiting</li>
            <li>{guests.filter((guest) => guest.rsvp === "attending" && guest.rehearsalDinner).length} invited to the rehearsal dinner</li>
            <li>{seated} seated at {tables.length} tables</li>
            <li>{program.length} moments on the wedding-day timeline</li>
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-serif text-2xl">Jump in</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link className="btn-ghost" to="/tasks">Checklist</Link>
            <Link className="btn-ghost" to="/guests">Guest list</Link>
            <Link className="btn-ghost" to="/tables">Table seating</Link>
            <Link className="btn-ghost" to="/program">Wedding day</Link>
            <Link className="btn-ghost" to="/organize">Vendors & budget</Link>
            <Link className="btn-ghost" to="/settings">Names & sharing</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
