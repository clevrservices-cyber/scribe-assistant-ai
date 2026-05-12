import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/templates")({ component: TemplatesPage });

type Row = { category: string; type: string; name: string; desc: string };

const ROWS: Row[] = [
  { category: "Emergency Medicine", type: "Full Visit Scribe", name: "Emergency Department Full Visit", desc: "Complete ED workflow from triage to discharge/admission" },
  { category: "Emergency Medicine", type: "Acute Care Scribe", name: "ED Trauma Activation", desc: "Trauma patient evaluation and interventions" },
  { category: "Emergency Medicine", type: "Acute Care Scribe", name: "ED Stroke Alert", desc: "Stroke protocol and neurological assessment" },
  { category: "Emergency Medicine", type: "Acute Care Scribe", name: "ED STEMI/Cardiac Alert", desc: "Acute myocardial infarction workflow" },
  { category: "Emergency Medicine", type: "Acute Care Scribe", name: "ED Sepsis Evaluation", desc: "Sepsis screening and treatment documentation" },
  { category: "Emergency Medicine", type: "Psychiatric Scribe", name: "ED Psychiatric Evaluation", desc: "Mental health crisis and suicide assessment" },
  { category: "Emergency Medicine", type: "Pediatric ED Scribe", name: "Pediatric Emergency Visit", desc: "Acute pediatric emergency management" },
  { category: "Emergency Medicine", type: "Observation Scribe", name: "ED Observation Note", desc: "Monitoring patients under observation status" },
  { category: "Emergency Medicine", type: "Procedure Scribe", name: "Laceration Repair Note", desc: "Minor wound repair documentation" },
  { category: "Emergency Medicine", type: "EMS Scribe", name: "EMS/Prehospital Report", desc: "Ambulance and field assessment documentation" },
  { category: "Emergency Medicine", type: "Disaster Medicine Scribe", name: "Mass Casualty Triage", desc: "Multi-patient disaster triage workflow" },
  { category: "Inpatient Medicine", type: "Admission Scribe", name: "Inpatient Admission H&P", desc: "Initial hospital admission documentation" },
  { category: "Inpatient Medicine", type: "ICU Scribe", name: "ICU Admission Note", desc: "Critical care admission evaluation" },
  { category: "Inpatient Medicine", type: "NICU Scribe", name: "NICU Admission", desc: "Neonatal intensive care documentation" },
  { category: "Inpatient Medicine", type: "PICU Scribe", name: "PICU Admission", desc: "Pediatric ICU assessment" },
  { category: "Inpatient Medicine", type: "Progress Note Scribe", name: "Hospitalist Progress Note", desc: "Daily inpatient follow-up" },
  { category: "Inpatient Medicine", type: "ICU Scribe", name: "ICU Daily Progress Note", desc: "Critical care daily" },
  { category: "Inpatient Medicine", type: "Consult Scribe", name: "Specialist Consult Note", desc: "Specialist inpatient consultation" },
  { category: "Inpatient Medicine", type: "Transfer Scribe", name: "Transfer Note", desc: "Transfer between units/facilities" },
  { category: "Inpatient Medicine", type: "Event Scribe", name: "Rapid Response Event", desc: "Acute patient deterioration" },
  { category: "Inpatient Medicine", type: "Event Scribe", name: "Code Blue Documentation", desc: "Cardiac arrest resuscitation" },
  { category: "Inpatient Medicine", type: "Discharge Scribe", name: "Inpatient Discharge Summary", desc: "Hospital course and discharge planning" },
  { category: "Inpatient Medicine", type: "Rehab Admission Scribe", name: "Skilled Nursing Facility Admission", desc: "Long-term rehab intake" },
  { category: "Primary Care", type: "New Patient Scribe", name: "Primary Care New Patient", desc: "Comprehensive baseline evaluation" },
  { category: "Primary Care", type: "Follow-up Scribe", name: "Primary Care Follow-Up", desc: "Chronic condition monitoring" },
  { category: "Primary Care", type: "Preventive Care Scribe", name: "Annual Physical Exam", desc: "Preventive health screening" },
  { category: "Primary Care", type: "Wellness Scribe", name: "Medicare Wellness Visit", desc: "Medicare preventive evaluation" },
  { category: "Primary Care", type: "Chronic Disease Scribe", name: "Hypertension Follow-Up", desc: "Blood pressure management" },
  { category: "Primary Care", type: "Chronic Disease Scribe", name: "Diabetes Follow-Up", desc: "Diabetes management and monitoring" },
  { category: "Primary Care", type: "Lifestyle Scribe", name: "Obesity Management", desc: "Weight management counseling" },
  { category: "Primary Care", type: "Counseling Scribe", name: "Smoking Cessation Visit", desc: "Tobacco cessation counseling" },
  { category: "Primary Care", type: "Vaccine Scribe", name: "Vaccination Visit", desc: "Immunization administration" },
  { category: "Primary Care", type: "Travel Medicine Scribe", name: "Travel Consultation", desc: "Vaccines and travel risk prevention" },
  { category: "Pediatrics", type: "Well Child Scribe", name: "Pediatric Well Child Check", desc: "Growth, development, immunizations" },
  { category: "Pediatrics", type: "Sick Visit Scribe", name: "Pediatric Sick Visit", desc: "Acute childhood illness documentation" },
  { category: "Pediatrics", type: "Neonatal Scribe", name: "Newborn Assessment", desc: "Initial newborn examination" },
  { category: "Pediatrics", type: "Developmental Scribe", name: "Developmental Delay Evaluation", desc: "Developmental milestone assessment" },
  { category: "Pediatrics", type: "Behavioral Scribe", name: "ADHD Evaluation", desc: "ADHD assessment and diagnosis" },
  { category: "Pediatrics", type: "Behavioral Scribe", name: "Autism Screening", desc: "Autism spectrum evaluation" },
  { category: "Pediatrics", type: "Chronic Disease Scribe", name: "Pediatric Asthma Follow-Up", desc: "Asthma management in children" },
  { category: "Pediatrics", type: "School Medicine Scribe", name: "School/Sports Physical", desc: "Sports participation clearance" },
  { category: "OB/GYN", type: "Obstetric Intake Scribe", name: "New OB Intake", desc: "Initial pregnancy assessment" },
  { category: "OB/GYN", type: "Prenatal Scribe", name: "Routine Prenatal Visit", desc: "Ongoing pregnancy monitoring" },
  { category: "OB/GYN", type: "High-Risk OB Scribe", name: "High-Risk Pregnancy Follow-Up", desc: "Maternal-fetal risk management" },
  { category: "OB/GYN", type: "Labor & Delivery Scribe", name: "Labor and Delivery Note", desc: "Delivery process documentation" },
  { category: "OB/GYN", type: "Surgical OB Scribe", name: "Cesarean Section Operative Note", desc: "C-section surgical documentation" },
  { category: "OB/GYN", type: "Postpartum Scribe", name: "Postpartum Visit", desc: "Maternal recovery follow-up" },
  { category: "OB/GYN", type: "Fertility Scribe", name: "Fertility Evaluation", desc: "Infertility assessment" },
  { category: "OB/GYN", type: "Gynecology Scribe", name: "Annual Well Woman Exam", desc: "Preventive gynecologic care" },
  { category: "Surgery", type: "Surgical Consult Scribe", name: "Pre-Operative Evaluation", desc: "Surgical risk assessment" },
  { category: "Surgery", type: "Surgical Scribe", name: "Operative Note", desc: "Intraoperative procedure documentation" },
  { category: "Surgery", type: "Post-Operative Scribe", name: "Post-Operative Follow-Up", desc: "Surgical recovery monitoring" },
  { category: "Surgery", type: "Trauma Surgery Scribe", name: "Trauma Surgery Evaluation", desc: "Surgical trauma management" },
  { category: "Surgery", type: "Bariatric Scribe", name: "Bariatric Surgery Visit", desc: "Weight-loss surgery workflow" },
  { category: "Orthopedics", type: "Orthopedic Scribe", name: "Fracture Evaluation", desc: "Bone fracture assessment" },
  { category: "Orthopedics", type: "Sports Injury Scribe", name: "Sports Injury Assessment", desc: "Athletic injury evaluation" },
  { category: "Orthopedics", type: "Joint Replacement Scribe", name: "Joint Replacement Follow-Up", desc: "Prosthetic joint monitoring" },
  { category: "Orthopedics", type: "Spine Scribe", name: "Spine Surgery Follow-Up", desc: "Spine procedure recovery" },
  { category: "Orthopedics", type: "Procedure Scribe", name: "Casting/Splint Procedure", desc: "Immobilization procedures" },
  { category: "Neurosurgery", type: "Neurosurgery Scribe", name: "Brain Tumor Evaluation", desc: "Neurosurgical oncology assessment" },
  { category: "Neurosurgery", type: "Spine Neurosurgery Scribe", name: "Spine Surgery Consultation", desc: "Neurosurgical spine evaluation" },
  { category: "Cardiology", type: "Cardiology Consult Scribe", name: "Chest Pain Evaluation", desc: "Cardiac chest pain assessment" },
  { category: "Cardiology", type: "Heart Failure Scribe", name: "Heart Failure Follow-Up", desc: "CHF monitoring" },
  { category: "Cardiology", type: "Arrhythmia Scribe", name: "Arrhythmia Clinic", desc: "Rhythm disorder management" },
  { category: "Cardiology", type: "Device Scribe", name: "Pacemaker Check", desc: "Cardiac device monitoring" },
  { category: "Cardiology", type: "Clearance Scribe", name: "Cardiac Clearance", desc: "Surgical cardiac risk assessment" },
  { category: "Pulmonology", type: "Pulmonary Scribe", name: "COPD Follow-Up", desc: "Chronic lung disease management" },
  { category: "Pulmonology", type: "Sleep Medicine Scribe", name: "Sleep Apnea Evaluation", desc: "Sleep disorder assessment" },
  { category: "Pulmonology", type: "Critical Care Scribe", name: "Ventilator Management", desc: "Mechanical ventilation documentation" },
  { category: "Pulmonology", type: "Procedure Scribe", name: "Bronchoscopy Procedure", desc: "Airway endoscopy" },
  { category: "Gastroenterology", type: "GI Clinic Scribe", name: "GERD Evaluation", desc: "Reflux disease management" },
  { category: "Gastroenterology", type: "IBD Scribe", name: "IBD Follow-Up", desc: "Crohn's/ulcerative colitis monitoring" },
  { category: "Gastroenterology", type: "Procedure Scribe", name: "Colonoscopy Note", desc: "Colonoscopy findings" },
  { category: "Gastroenterology", type: "Procedure Scribe", name: "EGD Note", desc: "Upper endoscopy" },
  { category: "Gastroenterology", type: "Hepatology Scribe", name: "Liver Disease Evaluation", desc: "Hepatic disorder assessment" },
  { category: "Endocrinology", type: "Diabetes Scribe", name: "Diabetes Management", desc: "Glycemic control workflow" },
  { category: "Endocrinology", type: "Thyroid Scribe", name: "Thyroid Disorder Follow-Up", desc: "Thyroid disease management" },
  { category: "Endocrinology", type: "Bone Health Scribe", name: "Osteoporosis Clinic", desc: "Bone density and fracture prevention" },
  { category: "Nephrology", type: "Kidney Disease Scribe", name: "CKD Follow-Up", desc: "Chronic kidney disease management" },
  { category: "Nephrology", type: "Dialysis Scribe", name: "Dialysis Note", desc: "Hemodialysis/peritoneal dialysis" },
  { category: "Rheumatology", type: "Autoimmune Scribe", name: "Lupus Evaluation", desc: "Systemic autoimmune assessment" },
  { category: "Rheumatology", type: "Arthritis Scribe", name: "Rheumatoid Arthritis Follow-Up", desc: "Inflammatory arthritis monitoring" },
  { category: "Infectious Disease", type: "Infectious Disease Scribe", name: "HIV Follow-Up", desc: "HIV management" },
  { category: "Infectious Disease", type: "Sepsis Consult Scribe", name: "Infectious Disease Sepsis Consult", desc: "Severe infection management" },
  { category: "Oncology", type: "Oncology Scribe", name: "Chemotherapy Visit", desc: "Cancer infusion treatment" },
  { category: "Oncology", type: "Radiation Oncology Scribe", name: "Radiation Follow-Up", desc: "Radiation treatment monitoring" },
  { category: "Oncology", type: "Hematology Scribe", name: "Leukemia/Lymphoma Evaluation", desc: "Blood cancer assessment" },
  { category: "Oncology", type: "Palliative Oncology Scribe", name: "Cancer Palliative Care", desc: "Symptom-focused oncology care" },
  { category: "Neurology", type: "Neurology Scribe", name: "Stroke Follow-Up", desc: "Post-stroke management" },
  { category: "Neurology", type: "Epilepsy Scribe", name: "Seizure Evaluation", desc: "Epilepsy assessment" },
  { category: "Neurology", type: "Movement Disorder Scribe", name: "Parkinson's Disease Clinic", desc: "Parkinson's monitoring" },
  { category: "Neurology", type: "Headache Scribe", name: "Migraine Consultation", desc: "Chronic headache management" },
  { category: "Neurology", type: "Neurodiagnostic Scribe", name: "EMG/NCS Interpretation", desc: "Nerve conduction studies" },
  { category: "Psychiatry", type: "Psychiatry Intake Scribe", name: "Initial Psychiatric Evaluation", desc: "Comprehensive psychiatric intake" },
  { category: "Psychiatry", type: "Medication Scribe", name: "Psychiatry Med Management", desc: "Psychiatric medication follow-up" },
  { category: "Psychiatry", type: "Addiction Scribe", name: "Substance Abuse Assessment", desc: "Addiction evaluation" },
  { category: "Psychiatry", type: "Risk Assessment Scribe", name: "Suicide Risk Assessment", desc: "Self-harm evaluation" },
  { category: "Psychiatry", type: "Trauma Psychiatry Scribe", name: "PTSD Evaluation", desc: "Trauma-related disorder management" },
  { category: "Psychology", type: "Neuropsychology Scribe", name: "Cognitive Assessment", desc: "Memory and cognition testing" },
  { category: "Psychology", type: "Behavioral Scribe", name: "Behavioral Assessment", desc: "Behavioral disorder evaluation" },
  { category: "Ophthalmology", type: "Eye Care Scribe", name: "Cataract Evaluation", desc: "Cataract assessment" },
  { category: "Ophthalmology", type: "Eye Care Scribe", name: "Glaucoma Follow-Up", desc: "Eye pressure monitoring" },
  { category: "Ophthalmology", type: "Retina Scribe", name: "Retinal Disease Evaluation", desc: "Retina pathology management" },
  { category: "ENT", type: "ENT Scribe", name: "Hearing Loss Evaluation", desc: "Ear and hearing assessment" },
  { category: "ENT", type: "ENT Scribe", name: "Sinusitis Visit", desc: "Sinus disorder management" },
  { category: "ENT", type: "Vestibular Scribe", name: "Vertigo Evaluation", desc: "Balance disorder assessment" },
  { category: "Audiology", type: "Audiology Scribe", name: "Hearing Test Interpretation", desc: "Audiogram review" },
  { category: "Dermatology", type: "Dermatology Scribe", name: "Skin Cancer Screening", desc: "Skin lesion assessment" },
  { category: "Dermatology", type: "Procedure Scribe", name: "Skin Biopsy Procedure", desc: "Dermatologic tissue sampling" },
  { category: "Dentistry", type: "Dental Scribe", name: "Dental Exam", desc: "Routine oral health evaluation" },
  { category: "Dentistry", type: "Oral Surgery Scribe", name: "Oral Surgery Consultation", desc: "Dental surgery planning" },
  { category: "Rehabilitation", type: "PM&R Scribe", name: "Stroke Rehab Evaluation", desc: "Rehabilitation medicine assessment" },
  { category: "Rehabilitation", type: "Functional Medicine Scribe", name: "Functional Capacity Evaluation", desc: "Disability and work function evaluation" },
  { category: "Physical Therapy", type: "PT Scribe", name: "Physical Therapy Evaluation", desc: "Functional movement assessment" },
  { category: "Physical Therapy", type: "PT Progress Scribe", name: "PT Progress Note", desc: "Therapy progression tracking" },
  { category: "Occupational Therapy", type: "OT Scribe", name: "Occupational Therapy Evaluation", desc: "Daily activity assessment" },
  { category: "Speech Therapy", type: "Speech Scribe", name: "Swallow Evaluation", desc: "Dysphagia assessment" },
  { category: "Speech Therapy", type: "Speech Scribe", name: "Speech Delay Assessment", desc: "Language development evaluation" },
  { category: "Pain Management", type: "Pain Scribe", name: "Chronic Pain Consultation", desc: "Persistent pain assessment" },
  { category: "Pain Management", type: "Procedure Scribe", name: "Nerve Block Procedure", desc: "Interventional pain procedure" },
  { category: "Palliative Care", type: "Hospice Scribe", name: "Hospice Intake", desc: "End-of-life care planning" },
  { category: "Geriatrics", type: "Geriatric Scribe", name: "Dementia Evaluation", desc: "Cognitive decline assessment" },
  { category: "Geriatrics", type: "Fall Risk Scribe", name: "Fall Risk Assessment", desc: "Elderly fall prevention" },
  { category: "Radiology", type: "Radiology Scribe", name: "X-Ray Interpretation", desc: "Imaging findings documentation" },
  { category: "Radiology", type: "Radiology Scribe", name: "CT/MRI Interpretation", desc: "Advanced imaging review" },
  { category: "Radiology", type: "IR Scribe", name: "Interventional Radiology Procedure", desc: "Minimally invasive procedures" },
  { category: "Pathology", type: "Pathology Scribe", name: "Biopsy Interpretation", desc: "Tissue pathology review" },
  { category: "Laboratory Medicine", type: "Lab Medicine Scribe", name: "Critical Lab Alert", desc: "Abnormal laboratory result escalation" },
  { category: "Home Health", type: "Home Health Scribe", name: "Home Visit Assessment", desc: "Home-based patient evaluation" },
  { category: "Telemedicine", type: "Telehealth Scribe", name: "Telemedicine Visit", desc: "Virtual healthcare encounter" },
  { category: "Long-Term Care", type: "Nursing Home Scribe", name: "Nursing Home Progress Note", desc: "Long-term facility follow-up" },
  { category: "Occupational Medicine", type: "Occupational Health Scribe", name: "Work Injury Evaluation", desc: "Workplace injury documentation" },
  { category: "Occupational Medicine", type: "Occupational Health Scribe", name: "Return-to-Work Clearance", desc: "Work fitness assessment" },
  { category: "Correctional Medicine", type: "Correctional Scribe", name: "Jail Intake Assessment", desc: "Correctional healthcare intake" },
  { category: "Administrative", type: "SOAP Scribe", name: "SOAP Note", desc: "Structured clinical note" },
  { category: "Administrative", type: "MDM Scribe", name: "Medical Decision Making", desc: "Clinical reasoning documentation" },
  { category: "Administrative", type: "Coding Scribe", name: "ICD-10 Coding Support", desc: "Diagnosis coding assistance" },
  { category: "Administrative", type: "Billing Scribe", name: "CPT Procedure Documentation", desc: "Billing code documentation" },
  { category: "Administrative", type: "Insurance Scribe", name: "Prior Authorization Note", desc: "Insurance approval support" },
  { category: "Administrative", type: "Legal Medical Scribe", name: "Disability Assessment", desc: "Disability and legal evaluations" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Chest Pain Workup", desc: "Structured chest pain differential" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Abdominal Pain Workup", desc: "Abdominal pain diagnostic pathway" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Headache Differential", desc: "Neurological headache evaluation" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Shortness of Breath Workup", desc: "Respiratory symptom algorithm" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Syncope Evaluation", desc: "Fainting diagnostic assessment" },
  { category: "Clinical Pathways", type: "Differential Diagnosis Scribe", name: "Rash Evaluation", desc: "Dermatologic differential diagnosis" },
  { category: "Clinical Scoring", type: "Risk Score Scribe", name: "NIH Stroke Scale", desc: "Neurological stroke severity scoring" },
  { category: "Clinical Scoring", type: "Risk Score Scribe", name: "Glasgow Coma Scale", desc: "Consciousness assessment" },
  { category: "Clinical Scoring", type: "Risk Score Scribe", name: "HEART Score", desc: "Chest pain cardiac risk stratification" },
  { category: "Clinical Scoring", type: "Risk Score Scribe", name: "Wells Score", desc: "Pulmonary embolism/DVT probability" },
  { category: "Clinical Scoring", type: "Risk Score Scribe", name: "SOFA Score", desc: "Organ failure assessment" },
  { category: "Legal & Consent", type: "Consent Scribe", name: "Surgical Consent", desc: "Surgical informed consent" },
  { category: "Legal & Consent", type: "Legal Scribe", name: "AMA Documentation", desc: "Against medical advice discharge" },
  { category: "Legal & Consent", type: "Advanced Directive Scribe", name: "DNR/DNI Documentation", desc: "Advance directives" },
];

function TemplatesPage() {
  const { t } = useLang();
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const filtered = ROWS.filter((r) => {
      const s = q.toLowerCase();
      return (
        !s ||
        r.category.toLowerCase().includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.name.toLowerCase().includes(s) ||
        r.desc.toLowerCase().includes(s)
      );
    });
    const map = new Map<string, Row[]>();
    for (const r of filtered) {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return Array.from(map.entries());
  }, [q]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">{t("Template Taxonomy", "อนุกรมวิธานเทมเพลต")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "Browse all clinical scribe templates by specialty.",
            "เรียกดูเทมเพลตการบันทึกทางคลินิกทั้งหมดตามสาขา",
          )}
        </p>
      </div>

      <Input
        placeholder={t("Search templates…", "ค้นหาเทมเพลต…")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="space-y-4">
        {grouped.map(([cat, rows]) => (
          <Card key={cat} className="p-4">
            <h3 className="font-display font-semibold text-primary mb-3">{cat}</h3>
            <ul className="divide-y divide-border">
              {rows.map((r, i) => (
                <li key={i} className="py-2">
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
