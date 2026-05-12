import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/ai-assistant")({ component: AIAssistant });

function AIAssistant() {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  const FAQS = [
    t("What goes in a SOAP note?", "SOAP note ประกอบด้วยอะไรบ้าง?"),
    t("How do I document a comprehensive ROS?", "บันทึก ROS ครบถ้วนอย่างไร?"),
    t(
      "What's the difference between an H&P and a Consult Note?",
      "H&P กับ Consult Note ต่างกันอย่างไร?",
    ),
    t("Best practices for ICD-10-CM coding?", "แนวทางการเขียนรหัส ICD-10-CM ที่ดี?"),
    t("How should I structure a Discharge Summary?", "ควรจัดโครงสร้าง Discharge Summary อย่างไร?"),
    t("Tips for accurate medical transcription?", "เคล็ดลับการถอดเสียงทางการแพทย์ให้แม่นยำ?"),
  ];

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
      toast.error(e instanceof Error ? e.message : t("Failed", "ล้มเหลว"));
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
          <h2 className="font-display text-xl font-bold">{t("AI Assistant", "ผู้ช่วย AI")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Clinical documentation guidance", "คำแนะนำเอกสารทางคลินิก")}
          </p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Textarea
          rows={4}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Type here your question…", "พิมพ์คำถามของคุณที่นี่…")}
        />
        <Button onClick={() => ask()} disabled={busy} className="w-full bg-gradient-primary">
          {busy ? <Loader2 className="size-4 animate-spin" /> : t("Ask", "ถาม")}
        </Button>
      </Card>

      {a && (
        <Card className="p-4">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{a}</div>
        </Card>
      )}

      <div>
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
          {t("Frequently Asked", "คำถามที่พบบ่อย")}
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
