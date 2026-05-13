import { z } from "zod";

// ==========================================
// LAYER 2: CLINICAL EXTRACTION SCHEMAS
// ==========================================

export const VitalsSchema = z.object({
  bloodPressure: z.string().optional().describe("e.g. 120/80"),
  heartRate: z.string().optional().describe("e.g. 72 bpm"),
  temperature: z.string().optional().describe("e.g. 98.6 F"),
  respiratoryRate: z.string().optional().describe("e.g. 16"),
  oxygenSaturation: z.string().optional().describe("e.g. 99% on RA"),
  weight: z.string().optional(),
  height: z.string().optional(),
});

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string().optional().describe("e.g. 20mg"),
  frequency: z.string().optional().describe("e.g. twice daily"),
  route: z.string().optional().describe("e.g. PO, IV"),
});

// The core "Clinical Memory" representation
// This schema forces the LLM to structure the messy audio transcript into discrete facts.
export const ClinicalEncounterSchema = z.object({
  chiefComplaint: z.string().describe("The primary reason for the visit"),
  hpi: z.string().describe("History of Present Illness - narrative summary of the current problem"),
  symptoms: z.array(z.string()).describe("List of reported symptoms"),
  duration: z.string().optional().describe("How long the symptoms have been present"),
  medications: z.array(MedicationSchema).describe("Current medications"),
  allergies: z.array(z.string()).describe("Known allergies"),
  pastMedicalHistory: z.array(z.string()).describe("Past medical conditions"),
  pastSurgicalHistory: z.array(z.string()).describe("Past surgeries"),
  familyHistory: z.array(z.string()).describe("Relevant family medical history"),
  socialHistory: z.array(z.string()).describe("Tobacco, alcohol, drug use, occupation, etc."),
  vitals: VitalsSchema.optional(),
  physicalExamFindings: z.array(z.string()).describe("Objective findings from the physical exam"),
  assessment: z.array(z.string()).describe("Diagnoses or differential diagnoses"),
  plan: z.array(z.string()).describe("Actionable next steps, orders, prescriptions, or follow-up"),
});

export type ClinicalEncounter = z.infer<typeof ClinicalEncounterSchema>;


// ==========================================
// LAYER 3: SKILL DEFINITIONS
// ==========================================

export interface ClinicalSkill {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  // Which fields from the ClinicalEncounter must be present to successfully use this skill
  requiredFields: (keyof ClinicalEncounter)[]; 
}

// MVP Skills Implementation
export const CLINICAL_SKILLS: Record<string, ClinicalSkill> = {
  SOAP: {
    id: "soap",
    name: "SOAP Note",
    description: "Standard Subjective, Objective, Assessment, Plan note.",
    systemPrompt: \`You are a clinical medical scribe. Generate a formal SOAP note based on the provided structured clinical data.

Rules:
- Subjective: Include chief complaint, HPI, symptoms, duration, and relevant history.
- Objective: Include vitals and physical exam findings.
- Assessment: Keep concise and list diagnoses.
- Plan: Must contain actionable next steps, medications, and follow-up.
- Use professional, objective clinical language.
- DO NOT invent information not present in the structured data.\`,
    requiredFields: ["chiefComplaint", "hpi", "assessment", "plan"],
  },
  
  PROGRESS_NOTE: {
    id: "progress_note",
    name: "Progress Note",
    description: "Inpatient or outpatient daily follow-up note.",
    systemPrompt: \`You are a clinical medical scribe. Generate a Progress Note based on the provided structured clinical data.

Rules:
- Focus on changes since the last visit/interval events.
- Include current vitals and updated physical exam.
- Update the assessment and plan based on the interval changes.
- Keep the narrative concise.
- DO NOT invent information not present in the structured data.\`,
    requiredFields: ["hpi", "vitals", "assessment", "plan"],
  },
  
  DISCHARGE_SUMMARY: {
    id: "discharge_summary",
    name: "Discharge Summary",
    description: "Comprehensive hospital course and discharge planning.",
    systemPrompt: \`You are a clinical medical scribe. Generate a formal Discharge Summary based on the provided structured clinical data.

Rules:
- Include admission date, discharge date (if provided), and discharge diagnoses.
- Summarize the hospital course in the HPI/Narrative section.
- List all discharge medications and instructions clearly.
- Include detailed follow-up plans.
- DO NOT invent information not present in the structured data.\`,
    requiredFields: ["chiefComplaint", "hpi", "pastMedicalHistory", "medications", "assessment", "plan"],
  }
};
