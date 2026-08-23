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
import { getWriteToken, setWriteToken } from "./writeToken";
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

function applyStoredToken(data: WeddingData): WeddingData {
  const token = getWriteToken(data.settings.githubToken);
  if (token && data.settings.githubToken !== token) {
    return { ...data, settings: { ...data.settings, githubToken: token } };
  }
  return data;
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<WeddingData>(() => applyStoredToken(loadLocal()));
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("off");
  const [syncMessage, setSyncMessage] = useState("");
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const pushingRef = useRef(false);
  const pendingPushRef = useRef(false);
  const gitTimer = useRef(0);

  dataRef.current = data;

  const setData: Dispatch<SetStateAction<WeddingData>> = (update) => {
    dirtyRef.current = true;
    setState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      return stampData(next);
    });
  };

  function setGithubToken(token: string) {
    setWriteToken(token);
    setState((current) => ({
      ...current,
      settings: { ...current.settings, githubToken: token },
    }));
  }

  async function pushCurrent(): Promise<void> {
    const snapshot = dataRef.current;
    if (!hasGithubTarget(snapshot.settings)) {
      setSyncState("off");
      setSyncMessage("Paste the write key once in Settings. After that, checks commit data/wedding.json.");
      return;
    }
    if (pushingRef.current) {
      pendingPushRef.current = true;
      return;
    }

    pushingRef.current = true;
    setSyncState("saving");
    setSyncMessage("Uploading wedding.json…");
    try {
      while (true) {
        pendingPushRef.current = false;
        const current = dataRef.current;
        const stamped = current.updatedAt;
        await pushToGithub(targetFromSettings(current.settings), current);
        if (dataRef.current.updatedAt === stamped) {
          dirtyRef.current = pendingPushRef.current;
          if (!pendingPushRef.current) break;
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
    const token = getWriteToken(local.settings.githubToken);
    const remote = await pullLatestShared(local.settings);
    if (!remote) throw new Error("Could not load data/wedding.json from GitHub.");
    if (dirtyRef.current || pushingRef.current) {
      throw new Error("Wait for the current upload to finish, then load again.");
    }
    const next = withLocalToken(remote, token);
    setState(next);
    saveLocal(next);
    setSyncState(hasGithubTarget(next.settings) ? "idle" : "off");
    setSyncMessage("Loaded data/wedding.json from GitHub.");
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = applyStoredToken(loadLocal());
      const file = await loadFileData();
      const remote = await pullLatestShared(local.settings);
      if (cancelled) return;

      if (dirtyRef.current) {
        setSyncState(hasGithubTarget(local.settings) ? "idle" : "off");
        setReady(true);
        return;
      }

      const token = getWriteToken(local.settings.githubToken);
      const next = withLocalToken(chooseWeddingData(local, file, remote), token);
      setState(next);
      saveLocal(next);
      if (hasGithubTarget(next.settings)) {
        setSyncState("idle");
        setSyncMessage("Ready. Checks upload data/wedding.json to GitHub.");
      } else {
        setSyncState("off");
        setSyncMessage("Paste the write key once in Settings so both phones share the JSON.");
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
    saveLocal(data);
    void saveFileData(data);

    if (!hasGithubTarget(data.settings)) {
      setSyncState("off");
      return;
    }
    if (syncState === "off") setSyncState("idle");
    window.clearTimeout(gitTimer.current);
    gitTimer.current = window.setTimeout(() => {
      if (!dirtyRef.current) return;
      void pushCurrent();
    }, 400);
    return () => window.clearTimeout(gitTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;

    function flush() {
      saveLocal(dataRef.current);
      if (dirtyRef.current && hasGithubTarget(dataRef.current.settings)) {
        void pushCurrent();
      }
    }

    async function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
        return;
      }
      if (dirtyRef.current || pushingRef.current) return;
      const local = dataRef.current;
      const remote = await pullLatestShared(local.settings);
      if (!remote || dirtyRef.current) return;
      const chosen = chooseWeddingData(local, null, remote);
      if (chosen.updatedAt === local.updatedAt) return;
      const next = withLocalToken(chosen, getWriteToken(local.settings.githubToken));
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
        const token = getWriteToken(data.settings.githubToken);
        const next = createDefaultData();
        next.settings.githubToken = token;
        setData(next);
      },
      syncState,
      syncMessage,
      syncNow: () => pushCurrent(),
      refreshFromGithub,
    }),
    [data, syncState, syncMessage],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be used inside WeddingProvider");
  return ctx;
}
