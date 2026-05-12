import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "th";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, th: string) => string;
}

const LangCtx = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "th" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (en: string, th: string) => (lang === "th" ? th : en);

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
