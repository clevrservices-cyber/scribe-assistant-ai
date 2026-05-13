import { ClinicalEncounter, ClinicalEncounterSchema, ClinicalSkill } from "./clinical-schema";

/**
 * Interface representing a generic LLM provider.
 * You can implement this using OpenAI, Claude, or a Supabase Edge Function.
 */
export interface LLMProvider {
  /**
   * Extract structured data from text using a schema
   * @param transcript The raw audio transcript
   * @param schema The Zod schema to enforce
   */
  extractStructuredData: (transcript: string, schema: any) => Promise<any>;
  
  /**
   * Generate free-text from a prompt
   * @param systemPrompt The instructions for formatting and tone
   * @param userMessage The actual data to process
   */
  generateText: (systemPrompt: string, userMessage: string) => Promise<string>;
}

export class ScribeOrchestrator {
  constructor(private llm: LLMProvider) {}

  /**
   * LAYER 2: CLINICAL EXTRACTION
   * Converts a raw transcript into a structured Clinical Encounter JSON.
   */
  async extractEncounter(transcript: string): Promise<ClinicalEncounter> {
    try {
      // The LLM provider is responsible for ensuring the output matches the Zod schema format.
      // E.g., using OpenAI's response_format with zodToJsonSchema
      const rawData = await this.llm.extractStructuredData(transcript, ClinicalEncounterSchema);
      
      // Validate the extracted data against our strict Zod schema
      // This protects the rest of the application from LLM hallucinations or malformed JSON
      const validatedData = ClinicalEncounterSchema.parse(rawData);
      
      return validatedData;
    } catch (error) {
      console.error("Failed to extract or validate clinical data", error);
      throw new Error("Clinical extraction failed. Please review the transcript.");
    }
  }

  /**
   * LAYER 3: SKILL-BASED GENERATION
   * Takes the structured data and a chosen skill, returning the final drafted note.
   */
  async generateDraftNote(encounterData: ClinicalEncounter, skill: ClinicalSkill): Promise<string> {
    // 1. Validation Step: Check if the required fields for this skill are present
    const missingFields = skill.requiredFields.filter(
      (field) => {
        const val = encounterData[field];
        if (Array.isArray(val)) return val.length === 0;
        return val === undefined || val === null || val === "";
      }
    );

    if (missingFields.length > 0) {
      // We log a warning. In a robust UI, you might pause here and ask the 
      // physician to fill in the missing required fields before proceeding.
      console.warn(`Warning: Missing recommended fields for ${skill.name}:`, missingFields);
    }

    // 2. Formatting the prompt
    // We pass the structured clinical data as a JSON string to the LLM, 
    // ensuring it only uses facts from this single source of truth.
    const userMessage = `
Here is the validated structured clinical data for the encounter:
\`\`\`json
${JSON.stringify(encounterData, null, 2)}
\`\`\`

Generate the final note according to your system instructions.
Do not include any information outside of the provided JSON.
`;

    // 3. Generate final draft
    const draftNote = await this.llm.generateText(skill.systemPrompt, userMessage);
    
    return draftNote;
  }

  /**
   * End-to-End Workflow
   * Runs the full pipeline: Transcript -> Structured JSON -> Final Note
   */
  async processFullEncounter(
    transcript: string, 
    skill: ClinicalSkill
  ): Promise<{ encounterData: ClinicalEncounter, draftNote: string }> {
    // Step 1: Extract "Clinical Memory"
    const encounterData = await this.extractEncounter(transcript);
    
    // Step 2: Use a "Skill" to format the note
    const draftNote = await this.generateDraftNote(encounterData, skill);
    
    return {
      encounterData,
      draftNote
    };
  }
}
