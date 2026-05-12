import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Upload,
  FileText,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Save,
  Trash2,
  Loader2,
  Sparkles,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRecorder } from "@/lib/recorder-context";
import { useScribeCtx } from "@/lib/scribe-context";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/scribe")({ component: ScribePage });

const SCRIBE_TYPES = [
  "SOAP Note",
  "History & Physical (H&P)",
  "Progress Note",
  "Discharge Summary",
  "Consult Note",
  "Procedure Note",
  "Operative Note",
  "Referral Letter",
  "Custom/Comprehensive",
];

function ScribePage() {
  const { user } = useAuth();
  const { isRecording, registerHandler } = useRecorder();
  const { setHasUnsavedDoc, registerReset, registerSave } = useScribeCtx();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [familyName, setFamilyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [scribeType, setScribeType] = useState("SOAP Note");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [codes, setCodes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [document, setDocument] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Receive recorded audio from FAB
  useEffect(() => {
    registerHandler((blob) => {
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      void transcribe(blob);
    });
    return () => registerHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function transcribe(blob: Blob) {
    try {
      setTranscribing(true);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const r = reader.result as string;
          resolve(r.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audioBase64: base64, mimeType: blob.type || "audio/webm" },
      });
      if (error) throw error;
      const text = (data as any)?.transcript ?? "";
      setTranscript((prev) => (prev ? prev + "\n" + text : text));
      toast.success(t("Transcription ready", "ถอดเสียงเสร็จแล้ว"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Transcription failed", "ถอดเสียงล้มเหลว"));
    } finally {
      setTranscribing(false);
    }
  }

  async function onUpload(file: File) {
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    await transcribe(file);
  }

  async function generate() {
    if (!transcript.trim()) {
      toast.error(t("Add or record a transcript first", "เพิ่มหรือบันทึกข้อความถอดก่อน"));
      return;
    }
    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-scribe", {
        body: {
          transcript,
          scribeType,
          patientFamilyName: familyName,
          patientFirstName: firstName,
          encounterDate: date ? format(date, "yyyy-MM-dd") : null,
          encounterTime: time,
          medicalCodes: codes,
        },
      });
      if (error) throw error;
      setDocument((data as any)?.document ?? "");
      toast.success(t("Document generated", "สร้างเอกสารแล้ว"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Generation failed", "การสร้างล้มเหลว"));
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!user) return;
    if (!document.trim()) {
      toast.error(t("Generate a document first", "สร้างเอกสารก่อน"));
      return;
    }
    try {
      setSaving(true);
      let audioPath: string | null = null;
      if (audioBlob) {
        const path = `${user.id}/${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage
          .from("audio")
          .upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm" });
        if (upErr) throw upErr;
        audioPath = path;
      }
      let patientId: string | null = null;
      if (familyName || firstName) {
        const { data: pat } = await supabase
          .from("patients")
          .insert({
            user_id: user.id,
            family_name: familyName,
            first_name: firstName,
          })
          .select("id")
          .single();
        patientId = pat?.id ?? null;
      }
      const { error } = await supabase.from("scribes").insert({
        user_id: user.id,
        patient_id: patientId,
        patient_family_name: familyName,
        patient_first_name: firstName,
        scribe_type: scribeType,
        encounter_date: date ? format(date, "yyyy-MM-dd") : null,
        encounter_time: time || null,
        medical_codes: codes,
        transcript,
        generated_document: document,
        audio_path: audioPath,
      });
      if (error) throw error;
      setHasUnsavedDoc(false);
      toast.success(t("Scribe saved", "บันทึกแล้ว"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Save failed", "บันทึกล้มเหลว"));
    } finally {
      setSaving(false);
    }
  }

  function copyDoc() {
    navigator.clipboard.writeText(document);
    toast.success(t("Copied to clipboard", "คัดลอกแล้ว"));
  }

  function toggleSpeak() {
    if (!document) return;
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(document.replace(/[*#_`>-]/g, ""));
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  }

  function downloadDoc() {
    const blob = new Blob([document], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${familyName || "scribe"}-${scribeType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    speechSynthesis.cancel();
    setSpeaking(false);
    setFamilyName("");
    setFirstName("");
    setCodes("");
    setTranscript("");
    setDocument("");
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setHasUnsavedDoc(false);
  }

  // Track unsaved + register reset/save callbacks for footer guard
  useEffect(() => {
    setHasUnsavedDoc(!!document.trim());
  }, [document, setHasUnsavedDoc]);

  useEffect(() => {
    registerReset(reset);
    registerSave(save);
    return () => {
      registerReset(null);
      registerSave(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, transcript, familyName, firstName, codes, date, time, audioBlob, scribeType, audioUrl]);

  // Stop any speech when navigating away
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  async function sendEmail() {
    if (!recipient || !document) return;
    try {
      setSending(true);
      const { error } = await supabase.functions.invoke("send-scribe-email", {
        body: {
          recipientEmail: recipient,
          subject: `${scribeType} — ${familyName} ${firstName}`.trim(),
          documentText: document,
          patientName: `${familyName} ${firstName}`.trim(),
        },
      });
      if (error) throw error;
      toast.success(t("Email sent", "ส่งอีเมลแล้ว"));
      setEmailOpen(false);
      setRecipient("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Email failed", "ส่งอีเมลล้มเหลว"));
    } finally {
      setSending(false);
    }
  }

  const recordingHint = useMemo(() => {
    if (isRecording)
      return t(
        "Recording… tap the red square in the footer to stop.",
        "กำลังบันทึก… แตะรูปสี่เหลี่ยมสีแดงด้านล่างเพื่อหยุด",
      );
    if (transcribing) return t("Transcribing audio…", "กำลังถอดเสียง…");
    return t(
      "Tap the mic in the footer to record, or upload a file.",
      "แตะไมโครโฟนด้านล่างเพื่อบันทึก หรืออัปโหลดไฟล์",
    );
  }, [isRecording, transcribing, t]);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="font-display text-xl font-semibold mb-3">{t("New Scribe", "บันทึกใหม่")}</h2>

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="family">{t("Family name", "นามสกุล")}</Label>
              <Input
                id="family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="first">{t("First name", "ชื่อ")}</Label>
              <Input
                id="first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
              />
            </div>
          </div>

          <div>
            <Label>{t("Scribe type", "ประเภทบันทึก")}</Label>
            <Select value={scribeType} onValueChange={setScribeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRIBE_TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {tp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("Encounter date", "วันที่พบแพทย์")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {date ? format(date, "PP") : t("Pick date", "เลือกวันที่")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="time">{t("Time", "เวลา")}</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="codes">{t("Medical codes (ICD-10 / CPT)", "รหัสทางการแพทย์ (ICD-10 / CPT)")}</Label>
            <Input
              id="codes"
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              placeholder="e.g. J45.909, 99213"
            />
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold">{t("Transcript", "ข้อความถอด")}</h3>
          <div className="flex gap-2">
            <input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-1" /> {t("Upload", "อัปโหลด")}
            </Button>
          </div>
        </div>

        {audioUrl && <audio controls src={audioUrl} className="w-full mb-2 h-10 rounded-md" />}

        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={recordingHint}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{recordingHint}</p>

        <Button
          onClick={generate}
          disabled={generating || !transcript.trim()}
          className="w-full mt-3 bg-gradient-primary text-white shadow-soft"
        >
          {generating ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          {t("Generate", "สร้าง")} {scribeType}
        </Button>
      </section>

      {document && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <FileText className="size-4" /> {t("Generated document", "เอกสารที่สร้าง")}
            </h3>
          </div>
          <Card className="p-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
            {document}
          </Card>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="outline" onClick={copyDoc}>
              <Copy className="size-4 mr-1" /> {t("Copy", "คัดลอก")}
            </Button>
            <Button
              variant={speaking ? "default" : "outline"}
              onClick={toggleSpeak}
              className={speaking ? "bg-primary text-primary-foreground" : ""}
            >
              {speaking ? <VolumeX className="size-4 mr-1" /> : <Volume2 className="size-4 mr-1" />}
              {speaking ? t("Stop", "หยุด") : t("Read aloud", "อ่านออกเสียง")}
            </Button>
            <Button variant="outline" onClick={downloadDoc}>
              <Download className="size-4 mr-1" /> {t("Download", "ดาวน์โหลด")}
            </Button>
            <Button variant="outline" onClick={() => setEmailOpen(true)}>
              <Send className="size-4 mr-1" /> {t("Email", "อีเมล")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-white">
              {saving ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Save className="size-4 mr-1" />
              )}
              {t("Save", "บันทึก")}
            </Button>
            <Button variant="ghost" onClick={reset}>
              <Trash2 className="size-4 mr-1" /> {t("Reset", "ล้าง")}
            </Button>
          </div>
        </section>
      )}

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Email scribe", "อีเมลบันทึก")}</DialogTitle>
          </DialogHeader>
          <Label htmlFor="rcpt">{t("Recipient email", "อีเมลผู้รับ")}</Label>
          <Input
            id="rcpt"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="colleague@clinic.com"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              {t("Cancel", "ยกเลิก")}
            </Button>
            <Button onClick={sendEmail} disabled={sending || !recipient}>
              {sending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
              {t("Send", "ส่ง")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
