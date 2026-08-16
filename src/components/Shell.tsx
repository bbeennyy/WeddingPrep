import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CheckSquare,
  Clock,
  Columns3,
  Home,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { coupleLabel } from "../defaults";
import { useWedding } from "../context";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/organize", label: "Organize", icon: MoreHorizontal },
  { to: "/guests", label: "Guests", icon: Users },
  { to: "/tables", label: "Tables", icon: Columns3 },
  { to: "/program", label: "Day", icon: Clock },
];

export function Shell() {
  const { data, syncState, syncMessage } = useWedding();
  const location = useLocation();
  const names = coupleLabel(data.settings);
  const syncHint =
    syncState === "saving"
      ? "Saving to GitHub…"
      : syncState === "saved"
        ? "Saved to GitHub"
        : syncState === "error"
          ? "GitHub save failed"
          : syncState === "off"
            ? "This device only"
            : "";

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-gold/15 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-serif text-2xl leading-none text-ink">{names}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted">
              Wedding prep
              {syncHint ? <span className="normal-case tracking-normal text-muted/80"> · {syncHint}</span> : null}
            </p>
          </div>
          <NavLink
            to="/settings"
            className="btn-ghost h-10 w-10 !p-0"
            aria-label="Settings"
            title={syncMessage || "Settings"}
          >
            <Settings className="h-4 w-4" />
          </NavLink>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                    isActive
                      ? "bg-ink text-cream"
                      : "text-muted hover:bg-white/70 hover:text-ink"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}
