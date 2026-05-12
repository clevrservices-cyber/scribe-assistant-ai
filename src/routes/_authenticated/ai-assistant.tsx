import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai-assistant")({ component: AIAssistant });

const FAQS = [
  "What goes in a SOAP note?",
  "How do I document a comprehensive ROS?",
  "What's the difference between an H&P and a Consult Note?",
  "Best practices for ICD-10-CM coding?",
  "How should I structure a Discharge Summary?",
  "Tips for accurate medical transcription?",
];

function AIAssistant() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (question?: string) => {
    const text = question ?? q;
    if (!text.trim()) return;
    setBusy(true);
    setA("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { question: text },
      });
      if (error) throw error;
      setA(data?.answer ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="size-10 grid place-items-center rounded-xl bg-gradient-primary text-white">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Clinical documentation guidance</p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Textarea
          rows={4}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type here your question…"
        />
        <Button onClick={() => ask()} disabled={busy} className="w-full bg-gradient-primary">
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Ask"}
        </Button>
      </Card>

      {a && (
        <Card className="p-4">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{a}</div>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
          Frequently Asked
        </h3>
        <ul className="space-y-2">
          {FAQS.map((f) => (
            <li key={f}>
              <button
                onClick={() => {
                  setQ(f);
                  ask(f);
                }}
                className="w-full text-left p-3 bg-card border border-border rounded-xl hover:border-primary hover:shadow-soft transition-all text-sm"
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
