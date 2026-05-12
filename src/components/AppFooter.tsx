import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Calendar, Bell, Settings, FolderOpen, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecorder } from "@/lib/recorder-context";

export function AppFooter() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { isRecording, toggleRecording, available } = useRecorder();

  const tabs = [
    { to: "/saved", icon: FolderOpen, label: "Saved" },
    { to: "/scribe", icon: Calendar, label: "New" },
    { to: "/ai-assistant", icon: Bell, label: "AI" },
    { to: "/profile", icon: Settings, label: "Profile" },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border shadow-elevated"
      aria-label="Main"
    >
      <div className="mx-auto max-w-2xl relative h-20 px-4">
        {/* Central record FAB */}
        <button
          onClick={() => {
            if (loc.pathname !== "/") navigate({ to: "/" });
            toggleRecording();
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
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
          {tabs.map((t, i) => {
            const active = loc.pathname === t.to;
            return (
              <li
                key={t.to}
                className={cn("flex justify-center", i === 1 && "pr-8", i === 2 && "pl-8")}
              >
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="size-5" />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
