import { FormEvent, useState, type ReactNode } from "react";

/** Soft gate only — the PIN is in client JS and can be bypassed. */
const APP_PIN = "1003";
const STORAGE_KEY = "wedding-prep-unlocked";

export function PinGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1",
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pin.trim() === APP_PIN) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
      return;
    }
    setError(true);
    setPin("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Wedding prep</p>
        <h1 className="mt-2 font-serif text-3xl text-ink">Enter PIN</h1>
        <p className="mt-2 text-sm text-muted">
          Private planner for Beniamin &amp; Evelyn. Soft lock only — keeps casual visitors out.
        </p>
        <label className="label mt-6" htmlFor="app-pin">
          PIN
        </label>
        <input
          id="app-pin"
          className="field tracking-[0.35em]"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          placeholder="••••"
        />
        {error ? <p className="mt-2 text-sm text-rose-800">Wrong PIN. Try again.</p> : null}
        <button type="submit" className="btn-primary mt-5 w-full">
          Unlock
        </button>
      </form>
    </div>
  );
}
