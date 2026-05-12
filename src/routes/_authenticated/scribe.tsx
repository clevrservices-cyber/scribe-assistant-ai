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
        body: { audio: base64, mimeType: blob.type || "audio/webm" },
      });
      if (error) throw error;
      const text = (data as any)?.transcript ?? "";
      setTranscript((prev) => (prev ? prev + "\n" + text : text));
      toast.success("Transcription ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transcription failed");
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
      toast.error("Add or record a transcript first");
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
      toast.success("Document generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!user) return;
    if (!document.trim()) {
      toast.error("Generate a document first");
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
      // Upsert patient
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
      toast.success("Scribe saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function copyDoc() {
    navigator.clipboard.writeText(document);
    toast.success("Copied to clipboard");
  }

  function speakDoc() {
    if (!document) return;
    const u = new SpeechSynthesisUtterance(document.replace(/[*#_`>-]/g, ""));
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
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
    setFamilyName("");
    setFirstName("");
    setCodes("");
    setTranscript("");
    setDocument("");
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  async function sendEmail() {
    if (!recipient || !document) return;
    try {
      setSending(true);
      const { error } = await supabase.functions.invoke("send-scribe-email", {
        body: {
          to: recipient,
          subject: `${scribeType} — ${familyName} ${firstName}`.trim(),
          document,
          patientName: `${familyName} ${firstName}`.trim(),
        },
      });
      if (error) throw error;
      toast.success("Email sent");
      setEmailOpen(false);
      setRecipient("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Email failed");
    } finally {
      setSending(false);
    }
  }

  const recordingHint = useMemo(() => {
    if (isRecording) return "Recording… tap the red square in the footer to stop.";
    if (transcribing) return "Transcribing audio…";
    return "Tap the mic in the footer to record, or upload a file.";
  }, [isRecording, transcribing]);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="font-display text-xl font-semibold mb-3">New Scribe</h2>

        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="family">Family name</Label>
              <Input
                id="family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="first">First name</Label>
              <Input
                id="first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
              />
            </div>
          </div>

          <div>
            <Label>Scribe type</Label>
            <Select value={scribeType} onValueChange={setScribeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRIBE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Encounter date</Label>
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
                    {date ? format(date, "PP") : "Pick date"}
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
              <Label htmlFor="time">Time</Label>
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
            <Label htmlFor="codes">Medical codes (ICD-10 / CPT)</Label>
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
          <h3 className="font-display font-semibold">Transcript</h3>
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
              <Upload className="size-4 mr-1" /> Upload
            </Button>
          </div>
        </div>

        {audioUrl && (
          <audio controls src={audioUrl} className="w-full mb-2 h-10 rounded-md" />
        )}

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
          Generate {scribeType}
        </Button>
      </section>

      {document && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <FileText className="size-4" /> Generated document
            </h3>
          </div>
          <Card className="p-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
            {document}
          </Card>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="outline" onClick={copyDoc}>
              <Copy className="size-4 mr-1" /> Copy
            </Button>
            <Button variant="outline" onClick={speakDoc}>
              <Volume2 className="size-4 mr-1" /> Read aloud
            </Button>
            <Button variant="outline" onClick={downloadDoc}>
              <Download className="size-4 mr-1" /> Download
            </Button>
            <Button variant="outline" onClick={() => setEmailOpen(true)}>
              <Send className="size-4 mr-1" /> Email
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-white">
              {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}
              Save
            </Button>
            <Button variant="ghost" onClick={reset}>
              <Trash2 className="size-4 mr-1" /> Reset
            </Button>
          </div>
        </section>
      )}

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Email scribe</DialogTitle>
          </DialogHeader>
          <Label htmlFor="rcpt">Recipient email</Label>
          <Input
            id="rcpt"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="colleague@clinic.com"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={sending || !recipient}>
              {sending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
