// Generate a structured medical scribe document from a transcript / notes.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCRIBE_TEMPLATES: Record<string, string> = {
  "SOAP Note":
    "Format strictly as a SOAP note: **Subjective**, **Objective**, **Assessment**, **Plan**.",
  "History & Physical (H&P)":
    "Format as a full H&P: Chief Complaint, HPI, PMH, PSH, Family Hx, Social Hx, ROS, Physical Exam, Assessment, Plan.",
  "Progress Note":
    "Format as a daily progress note: Interval History, Exam, Labs/Imaging, Assessment & Plan by problem.",
  "Discharge Summary":
    "Format as a discharge summary: Admission diagnosis, Hospital course, Procedures, Discharge diagnoses, Discharge medications, Follow-up, Disposition.",
  "Consult Note":
    "Format as a consult note: Reason for consult, HPI, Pertinent findings, Impression, Recommendations.",
  "Procedure Note":
    "Format as a procedure note: Indication, Consent, Procedure, Findings, Complications, EBL, Disposition.",
  "Operative Note":
    "Format as an operative note: Pre-op dx, Post-op dx, Procedure performed, Surgeon, Anesthesia, Findings, Specimens, EBL, Complications, Disposition.",
  "Referral Letter":
    "Format as a referral letter: Salutation, Reason for referral, Relevant history, Current medications, Examination findings, Investigations, Working diagnosis, Specific question/request, Sign-off.",
  "Custom/Comprehensive":
    "Produce a comprehensive narrative covering everything clinically relevant.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      transcript,
      scribeType,
      patientFamilyName,
      patientFirstName,
      encounterDate,
      encounterTime,
      medicalCodes,
    } = await req.json();

    if (!transcript || !scribeType) throw new Error("transcript and scribeType required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tmpl = SCRIBE_TEMPLATES[scribeType] ?? SCRIBE_TEMPLATES["Custom/Comprehensive"];

    const system = `You are an expert medical scribe assistant. Produce a polished, professional clinical document in clean Markdown.

Document type: ${scribeType}
${tmpl}

Always include the following sections in addition to the type-specific format above, when content allows:
- **Patient Profile**
- **Chief Complaint / HPI**
- **Review of Systems / Examination**
- **Tests & Investigations**
- **Assessment & Plan**
- **Medications & Allergies**

If a section has no information, write "Not documented." Do not invent clinical facts. Use precise medical language. Render the final document only — no preamble.`;

    const userMsg = `Patient: ${patientFamilyName ?? ""}, ${patientFirstName ?? ""}
Encounter date/time: ${encounterDate ?? ""} ${encounterTime ?? ""}
Suggested medical codes (ICD-10-CM / CPT): ${medicalCodes ?? "none provided"}

Encounter transcript / notes:
"""
${transcript}
"""`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const document = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ document }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
