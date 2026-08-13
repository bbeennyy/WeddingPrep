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
  pullFromGithub,
  pushToGithub,
  saveFileData,
  saveLocal,
  stampData,
  targetFromSettings,
} from "./storage";
import type { WeddingData } from "./types";

interface WeddingContextValue {
  data: WeddingData;
  setData: Dispatch<SetStateAction<WeddingData>>;
  patch: <K extends keyof WeddingData>(key: K, value: WeddingData[K]) => void;
  reset: () => void;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [data, setState] = useState<WeddingData>(() => loadLocal());
  const [ready, setReady] = useState(false);
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const fileTimer = useRef(0);
  const gitTimer = useRef(0);

  dataRef.current = data;

  const setData: Dispatch<SetStateAction<WeddingData>> = (update) => {
    dirtyRef.current = true;
    setState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      return stampData(next);
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = loadLocal();
      const file = await loadFileData();
      let remote: WeddingData | null = null;
      if (hasGithubTarget(local.settings)) {
        try {
          remote = await pullFromGithub(targetFromSettings(local.settings));
        } catch {
          remote = null;
        }
      }
      if (cancelled) return;

      const token = local.settings.githubToken;
      if (dirtyRef.current) {
        setReady(true);
        return;
      }

      const next = chooseWeddingData(local, file, remote);
      next.settings.githubToken = token;
      if (!next.updatedAt) {
        next.updatedAt = new Date().toISOString();
      }
      setState(next);
      saveLocal(next);
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

    window.clearTimeout(fileTimer.current);
    fileTimer.current = window.setTimeout(() => {
      void saveFileData(data);
    }, 400);

    if (hasGithubTarget(data.settings)) {
      window.clearTimeout(gitTimer.current);
      gitTimer.current = window.setTimeout(() => {
        void pushToGithub(targetFromSettings(data.settings), data).catch(() => undefined);
      }, 2500);
    }

    return () => {
      window.clearTimeout(fileTimer.current);
      window.clearTimeout(gitTimer.current);
    };
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;

    function flush() {
      const current = dataRef.current;
      saveLocal(current);
      void saveFileData(current);
      if (hasGithubTarget(current.settings)) {
        void pushToGithub(targetFromSettings(current.settings), current).catch(() => undefined);
      }
    }

    function onHide() {
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [ready]);

  const value = useMemo<WeddingContextValue>(
    () => ({
      data,
      setData,
      patch: (key, value) => setData((current) => ({ ...current, [key]: value })),
      reset: () => {
        const token = data.settings.githubToken;
        const next = createDefaultData();
        next.settings.githubToken = token;
        setData(next);
      },
    }),
    [data],
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding(): WeddingContextValue {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding must be used inside WeddingProvider");
  return ctx;
}
