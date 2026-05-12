import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Info, Sparkles, LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function AppHeader() {
  const [info, setInfo] = useState(false);
  const { t } = useLang();

  return (
    <header className="sticky top-0 z-40 bg-card/85 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-2xl flex items-center gap-2 px-4 h-14">
        <button
          onClick={() => setInfo(true)}
          aria-label="App info"
          className="size-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <Info className="size-5" />
        </button>

        <h1 className="flex-1 text-center font-display font-semibold text-base sm:text-lg tracking-tight">
          Scribe Mate
        </h1>

        <Link
          to="/ai-assistant"
          aria-label={t("AI Assistant", "ผู้ช่วย AI")}
          className="size-9 grid place-items-center rounded-full bg-gradient-primary text-white shadow-soft"
        >
          <Sparkles className="size-4" />
        </Link>

        <Link
          to="/templates"
          aria-label={t("Templates", "เทมเพลต")}
          className="size-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <LayoutGrid className="size-5" />
        </Link>
      </div>

      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scribe Mate</DialogTitle>
            <DialogDescription>{t("Version", "เวอร์ชัน")} 1.0.1</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(
              "AI-powered clinical documentation. Record, transcribe and generate professional notes in seconds.",
              "เอกสารทางคลินิกขับเคลื่อนด้วย AI บันทึกเสียง ถอดความ และสร้างโน้ตมืออาชีพในไม่กี่วินาที",
            )}
          </p>
          <Button onClick={() => setInfo(false)} className="w-full">
            {t("Close", "ปิด")}
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
