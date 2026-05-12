import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/saved")({ component: SavedPage });

interface Scribe {
  id: string;
  patient_family_name: string | null;
  patient_first_name: string | null;
  scribe_type: string;
  encounter_date: string | null;
  medical_codes: string | null;
  created_at: string;
}

function SavedPage() {
  const [items, setItems] = useState<Scribe[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("scribes")
        .select("id,patient_family_name,patient_first_name,scribe_type,encounter_date,medical_codes,created_at")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return items;
    return items.filter((i) =>
      [
        i.patient_family_name,
        i.patient_first_name,
        i.scribe_type,
        i.encounter_date,
        i.medical_codes,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [items, q]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Saved Scribes</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient, date, type, code…"
          className="pl-9 rounded-2xl"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          {items.length === 0 ? "No scribes saved yet." : "No matches."}
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => navigate({ to: "/scribe", search: { id: s.id } })}
                className="w-full text-left p-4 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-soft transition flex gap-3 items-start"
              >
                <div className="size-10 grid place-items-center rounded-xl bg-accent text-accent-foreground shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">
                    {[s.patient_family_name, s.patient_first_name].filter(Boolean).join(", ") ||
                      "Unnamed patient"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.scribe_type} · {s.encounter_date ?? new Date(s.created_at).toLocaleDateString()}
                  </div>
                  {s.medical_codes && (
                    <div className="text-xs text-primary mt-1 truncate">{s.medical_codes}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
