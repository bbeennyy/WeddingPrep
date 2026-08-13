import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createDefaultData } from "./defaults";
import { loadLocal, saveLocal } from "./storage";
import type { WeddingData } from "./types";

interface WeddingContextValue {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData>>;
  patch: <K extends keyof WeddingData>(key: K, value: WeddingData[K]) => void;
  reset: () => void;
}

const WeddingContext = createContext<WeddingContextValue | null>(null);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WeddingData>(() => loadLocal());

  useEffect(() => {
    saveLocal(data);
  }, [data]);

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
