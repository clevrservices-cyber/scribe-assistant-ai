import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ScribeCtx {
  hasUnsavedDoc: boolean;
  setHasUnsavedDoc: (v: boolean) => void;
  registerReset: (fn: (() => void) | null) => void;
  triggerReset: () => void;
  registerSave: (fn: (() => Promise<void> | void) | null) => void;
  triggerSave: () => Promise<void>;
}

const Ctx = createContext<ScribeCtx>({
  hasUnsavedDoc: false,
  setHasUnsavedDoc: () => {},
  registerReset: () => {},
  triggerReset: () => {},
  registerSave: () => {},
  triggerSave: async () => {},
});

export function ScribeProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedDoc, setHasUnsavedDoc] = useState(false);
  const resetRef = useRef<(() => void) | null>(null);
  const saveRef = useRef<(() => Promise<void> | void) | null>(null);

  const registerReset = useCallback((fn: (() => void) | null) => {
    resetRef.current = fn;
  }, []);
  const registerSave = useCallback((fn: (() => Promise<void> | void) | null) => {
    saveRef.current = fn;
  }, []);
  const triggerReset = useCallback(() => {
    resetRef.current?.();
  }, []);
  const triggerSave = useCallback(async () => {
    await saveRef.current?.();
  }, []);

  return (
    <Ctx.Provider
      value={{ hasUnsavedDoc, setHasUnsavedDoc, registerReset, triggerReset, registerSave, triggerSave }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useScribeCtx = () => useContext(Ctx);
