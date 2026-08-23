import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createDefaultData } from "./defaults";
import {
  chooseWeddingData,
  hasGithubTarget,
  loadFileData,
  loadLocal,
  pullLatestShared,
  pushToGithub,
  saveFileData,
  saveLocal,
  stampData,
  targetFromSettings,
} from "./storage";
import type { WeddingData } from "./types";

export type SyncState = "off" | "idle" | "saving" | "saved" | "error";

interface WeddingContextValue {
  data: WeddingData;
  setData: Dispatch<SetStateAction<WeddingData>>;
  patch: <K extends keyof WeddingData>(key: K, value: WeddingData[K]) => void;
  setGithubToken: (token: string) => void;
  reset: () => void;
  syncState: SyncState;
  syncMessage: string;
  syncNow: () => Promise<void>;
  refreshFromGithub: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

function withLocalToken(next: WeddingData, token: string): WeddingData {
  next.settings.githubToken = token;
  if (!next.updatedAt) next.updatedAt = new Date().toISOString();
  return next;
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<WeddingData>(() => loadLocal());
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("off");
  const [syncMessage, setSyncMessage] = useState("");
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const pushingRef = useRef(false);
  const pendingPushRef = useRef(false);
  const connectedTokenRef = useRef(data.settings.githubToken.trim());
  const fileTimer = useRef(0);
  const gitTimer = useRef(0);
  const connectTimer = useRef(0);

  dataRef.current = data;

  const setData: Dispatch<SetStateAction<WeddingData>> = (update) => {
    dirtyRef.current = true;
    setState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      return stampData(next);
    });
  };

  function setGithubToken(token: string) {
    setState((current) => ({
      ...current,
      settings: { ...current.settings, githubToken: token },
    }));
  }

  async function pushCurrent(reason: string): Promise<void> {
    const snapshot = dataRef.current;
    if (!hasGithubTarget(snapshot.settings)) {
      setSyncState("off");
      setSyncMessage("Add a GitHub token in Settings to save to the shared JSON file.");
      return;
    }

    if (pushingRef.current) {
      pendingPushRef.current = true;
      return;
    }

    pushingRef.current = true;
    setSyncState("saving");
    setSyncMessage(reason);
    try {
      while (true) {
        pendingPushRef.current = false;
        const current = dataRef.current;
        const stamped = current.updatedAt;
        await pushToGithub(targetFromSettings(current.settings), current);
        if (dataRef.current.updatedAt === stamped && !pendingPushRef.current) {
          dirtyRef.current = false;
          break;
        }
      }
      setSyncState("saved");
      setSyncMessage(`Saved to GitHub at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Could not save to GitHub.");
    } finally {
      pushingRef.current = false;
    }
  }

  async function refreshFromGithub(): Promise<void> {
    const local = dataRef.current;
    const token = local.settings.githubToken;
    const remote = await pullLatestShared(local.settings);
    if (!remote) throw new Error("Could not load the shared file from GitHub.");
    if (dirtyRef.current || pushingRef.current) {
      throw new Error("Finish saving local edits first, then load again.");
    }
    const next = withLocalToken(remote, token);
    setState(next);
    saveLocal(next);
    setSyncState(hasGithubTarget(next.settings) ? "idle" : "off");
    setSyncMessage("Loaded the latest shared file from GitHub.");
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = loadLocal();
      const file = await loadFileData();
      const remote = await pullLatestShared(local.settings);
      if (cancelled) return;

      const token = local.settings.githubToken;
      if (dirtyRef.current) {
        setSyncState(hasGithubTarget(local.settings) ? "idle" : "off");
        setReady(true);
        return;
      }

      const next = withLocalToken(chooseWeddingData(local, file, remote), token);
      setState(next);
      saveLocal(next);
      if (hasGithubTarget(next.settings)) {
        connectedTokenRef.current = token.trim();
        setSyncState("idle");
        setSyncMessage("GitHub sync is on — edits save to data/wedding.json.");
      } else {
        setSyncState("off");
        setSyncMessage("This browser only. Paste a GitHub token in Settings to sync phones.");
      }
      setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const token = data.settings.githubToken.trim();
    if (!token || !hasGithubTarget(data.settings)) {
      connectedTokenRef.current = "";
      return;
    }
    if (token === connectedTokenRef.current) return;

    window.clearTimeout(connectTimer.current);
    connectTimer.current = window.setTimeout(() => {
      void (async () => {
        const current = dataRef.current;
        const nextToken = current.settings.githubToken.trim();
        if (!nextToken || nextToken === connectedTokenRef.current) return;
        setSyncState("saving");
        setSyncMessage("Connecting to the shared file…");
        try {
          const remote = await pullLatestShared(current.settings);
          connectedTokenRef.current = nextToken;
          if (remote && !dirtyRef.current) {
            const chosen = chooseWeddingData(current, null, remote);
            const next = withLocalToken(chosen, nextToken);
            setState(next);
            saveLocal(next);
          }
          setSyncState("idle");
          setSyncMessage("GitHub sync is on — edits save to data/wedding.json.");
        } catch (error) {
          setSyncState("error");
          setSyncMessage(error instanceof Error ? error.message : "Could not connect to GitHub.");
        }
      })();
    }, 500);

    return () => {
      window.clearTimeout(connectTimer.current);
    };
  }, [data.settings.githubToken, ready]);

  useEffect(() => {
    if (!ready) return;

    saveLocal(data);

    window.clearTimeout(fileTimer.current);
    fileTimer.current = window.setTimeout(() => {
      void saveFileData(data);
    }, 400);

    if (hasGithubTarget(data.settings)) {
      if (syncState === "off") setSyncState("idle");
      window.clearTimeout(gitTimer.current);
      gitTimer.current = window.setTimeout(() => {
        if (!dirtyRef.current) return;
        void pushCurrent("Saving to GitHub…");
      }, 1100);
    } else {
      setSyncState("off");
    }

    return () => {
      window.clearTimeout(fileTimer.current);
      window.clearTimeout(gitTimer.current);
    };
    // syncState intentionally omitted — avoid retrigger loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;

    function flush() {
      const current = dataRef.current;
      saveLocal(current);
      void saveFileData(current);
      if (dirtyRef.current && hasGithubTarget(current.settings)) {
        void pushCurrent("Saving to GitHub…");
      }
    }

    async function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
        return;
      }
      // Coming back to the tab — pick up edits from the other phone
      if (dirtyRef.current || pushingRef.current) return;
      const local = dataRef.current;
      const token = local.settings.githubToken;
      const remote = await pullLatestShared(local.settings);
      if (!remote || dirtyRef.current) return;
      const chosen = chooseWeddingData(local, null, remote);
      if (chosen.updatedAt === local.updatedAt && richnessEqual(chosen, local)) return;
      const next = withLocalToken(chosen, token);
      setState(next);
      saveLocal(next);
      setSyncMessage("Updated from GitHub.");
      setSyncState(hasGithubTarget(next.settings) ? "idle" : "off");
    }

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready]);

  const value = useMemo<WeddingContextValue>(
    () => ({
      data,
      setData,
      patch: (key, value) => setData((current) => ({ ...current, [key]: value })),
      setGithubToken,
      reset: () => {
        const token = data.settings.githubToken;
        const next = createDefaultData();
        next.settings.githubToken = token;
        setData(next);
      },
      syncState,
      syncMessage,
      syncNow: () => pushCurrent("Saving to GitHub…"),
      refreshFromGithub,
    }),
    [data, syncState, syncMessage],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

function richnessEqual(a: WeddingData, b: WeddingData): boolean {
  return (
    a.guests.length === b.guests.length &&
    a.checklist.filter((item) => item.done).length === b.checklist.filter((item) => item.done).length &&
    a.updatedAt === b.updatedAt
  );
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be used inside WeddingProvider");
  return ctx;
}
