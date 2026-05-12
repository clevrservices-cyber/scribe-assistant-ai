import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Calendar, Settings, FolderOpen, Mic, Square, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecorder } from "@/lib/recorder-context";
import { useScribeCtx } from "@/lib/scribe-context";
import { useLang } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppFooter() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isRecording, toggleRecording, available } = useRecorder();
  const { hasUnsavedDoc, triggerReset, triggerSave } = useScribeCtx();
  const { t } = useLang();
  const [confirm, setConfirm] = useState(false);

  const tabs = [
    { to: "/saved", icon: FolderOpen, label: t("Saved", "บันทึกแล้ว") },
    { to: "/scribe", icon: Calendar, label: t("New", "ใหม่"), guard: true },
    { to: "/templates", icon: LayoutGrid, label: t("Template", "เทมเพลต") },
    { to: "/profile", icon: Settings, label: t("Profile", "โปรไฟล์") },
  ] as const;

  const goNew = () => {
    if (loc.pathname === "/scribe") {
      if (hasUnsavedDoc) setConfirm(true);
      else triggerReset();
    } else {
      navigate({ to: "/scribe" });
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border shadow-elevated"
        aria-label="Main"
      >
        <div className="mx-auto max-w-2xl relative h-20 px-4">
          <button
            onClick={() => {
              if (loc.pathname !== "/scribe") navigate({ to: "/scribe" });
              toggleRecording();
            }}
            aria-label={isRecording ? t("Stop recording", "หยุดบันทึก") : t("Start recording", "เริ่มบันทึก")}
            disabled={!available}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-7 size-16 rounded-full grid place-items-center text-white transition-transform active:scale-95 shadow-fab",
              isRecording ? "bg-destructive pulse-rec" : "bg-gradient-primary",
              !available && "opacity-50 cursor-not-allowed",
            )}
          >
            {isRecording ? <Square className="size-6 fill-white" /> : <Mic className="size-7" />}
          </button>

          <ul className="grid grid-cols-4 h-full items-center text-xs">
            {tabs.map((tab, i) => {
              const active = loc.pathname === tab.to;
              const inner = (
                <>
                  <tab.icon className="size-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </>
              );
              const cls = cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              );
              return (
                <li
                  key={tab.to}
                  className={cn("flex justify-center", i === 1 && "pr-8", i === 2 && "pl-8")}
                >
                  {"guard" in tab && tab.guard ? (
                    <button onClick={goNew} className={cls}>
                      {inner}
                    </button>
                  ) : (
                    <Link to={tab.to} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Save before resetting?", "บันทึกก่อนล้างหรือไม่?")}</DialogTitle>
            <DialogDescription>
              {t(
                "Your generated document hasn't been saved. Save it before starting a new scribe?",
                "เอกสารที่สร้างยังไม่ได้บันทึก ต้องการบันทึกก่อนเริ่มใหม่หรือไม่?",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirm(false);
                triggerReset();
              }}
            >
              {t("Discard", "ทิ้ง")}
            </Button>
            <Button
              className="bg-gradient-primary text-white"
              onClick={async () => {
                await triggerSave();
                setConfirm(false);
                triggerReset();
              }}
            >
              {t("Save & continue", "บันทึกและดำเนินการต่อ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
