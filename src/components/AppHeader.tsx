import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Info, Sparkles, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const [info, setInfo] = useState(false);
  const navigate = useNavigate();

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
          Medical Scribe Generator
        </h1>

        <Link
          to="/ai-assistant"
          aria-label="AI Assistant"
          className="size-9 grid place-items-center rounded-full bg-gradient-primary text-white shadow-soft"
        >
          <Sparkles className="size-4" />
        </Link>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/login" });
          }}
          aria-label="Sign out"
          className="size-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <LogOut className="size-5" />
        </button>
      </div>

      <Dialog open={info} onOpenChange={setInfo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Medical Scribe Generator</DialogTitle>
            <DialogDescription>Version 1.0.1</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            AI-powered clinical documentation. Record, transcribe and generate professional notes
            in seconds.
          </p>
          <Button onClick={() => setInfo(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
