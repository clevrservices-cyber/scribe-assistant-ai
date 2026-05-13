// Generate a structured medical scribe document from a transcript / notes using a 2-layer architecture.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_SYSTEM_PROMPT = `You are a clinical extraction engine. Your job is to extract medical facts from the provided transcript into a strict JSON format. 
Do not invent facts. If something is missing, omit it or leave it empty.

Output STRICTLY valid JSON matching this structure:
{
  "chiefComplaint": "string",
  "hpi": "string (narrative)",
  "symptoms": ["string"],
  "duration": "string",
  "medications": [{ "name": "string", "dosage": "string", "frequency": "string" }],
  "allergies": ["string"],
  "pastMedicalHistory": ["string"],
  "pastSurgicalHistory": ["string"],
  "familyHistory": ["string"],
  "socialHistory": ["string"],
  "vitals": { "bloodPressure": "string", "heartRate": "string", "temperature": "string" },
  "physicalExamFindings": ["string"],
  "assessment": ["string"],
  "plan": ["string"]
}

Output ONLY valid JSON without Markdown blocks if possible (or at least valid parsable JSON).`;

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

    const callAI = async (system: string, user: string, format: "json_object" | "text" = "text") => {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          response_format: format === "json_object" ? { type: "json_object" } : undefined,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!resp.ok) {
        throw new Error(`AI error: ${resp.status} ${await resp.text()}`);
      }
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content ?? "";
    };

    // LAYER 2: EXTRACT STRUCTURED JSON (Clinical Memory)
    console.log("Extracting clinical data...");
    const rawJsonString = await callAI(EXTRACTION_SYSTEM_PROMPT, transcript, "json_object");
    
    // Clean up potential markdown formatting in JSON response
    let cleanJson = rawJsonString;
    if (cleanJson.startsWith("\`\`\`json")) {
      cleanJson = cleanJson.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
    }
    
    let structuredData = {};
    try {
      structuredData = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Failed to parse AI JSON output, returning empty structured data", e);
    }

    // LAYER 3: GENERATE NOTE USING ONLY THE STRUCTURED DATA
    const tmpl = SCRIBE_TEMPLATES[scribeType] ?? SCRIBE_TEMPLATES["Custom/Comprehensive"];
    const generationSystemPrompt = `You are an expert medical scribe assistant. Produce a polished, professional clinical document in clean Markdown.

Document type: ${scribeType}
${tmpl}

RULES:
- Base the document ONLY on the provided structured clinical data.
- If a section has no information, write "Not documented." 
- Do not invent clinical facts. 
- Use precise medical language. 
- Render the final document only — no preamble.`;

    const generationUserMsg = `Patient: ${patientFamilyName ?? ""}, ${patientFirstName ?? ""}
Encounter date/time: ${encounterDate ?? ""} ${encounterTime ?? ""}
Suggested medical codes (ICD-10-CM / CPT): ${medicalCodes ?? "none provided"}

STRUCTURED CLINICAL DATA:
${JSON.stringify(structuredData, null, 2)}`;

    console.log("Generating final note...");
    const document = await callAI(generationSystemPrompt, generationUserMsg, "text");

    return new Response(JSON.stringify({ document, structuredData }), {
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
