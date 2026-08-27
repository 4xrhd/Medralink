/**
 * Medical Ontology & Terminology Bindings for MedraLink FHIRAgent
 * Standardized across SNOMED-CT, LOINC, and RxNorm.
 */

const ONTOLOGY_MAP = {
  conditions: {
    'diabetes': { snomed: '44054006', display: 'Type 2 Diabetes Mellitus', icd10: 'E11' },
    'hypertension': { snomed: '38341003', display: 'Essential Hypertension', icd10: 'I10' },
    'asthma': { snomed: '195967001', display: 'Asthma', icd10: 'J45' },
    'polytrauma': { snomed: '127295002', display: 'Traumatic Brain Injury / Polytrauma', icd10: 'T07' },
    'myocardial_infarction': { snomed: '22298006', display: 'Acute Myocardial Infarction', icd10: 'I21' },
  },
  allergies: {
    'penicillin': { snomed: '373270004', display: 'Penicillin - substance with penicillin structure', severity: 'severe', reaction: 'Anaphylaxis (SNOMED 39579001)' },
    'sulfa': { snomed: '91936005', display: 'Sulfonamide antibacterial agent', severity: 'moderate', reaction: 'Urticaria' },
    'aspirin': { snomed: '293586001', display: 'Aspirin allergy', severity: 'moderate', reaction: 'Bronchospasm' },
  },
  medications: {
    'metformin': { rxnorm: '860975', display: 'Metformin hydrochloride 500 MG Oral Tablet', dose: '500mg daily' },
    'amlodipine': { rxnorm: '312961', display: 'Amlodipine 5 MG Oral Tablet', dose: '5mg once daily' },
    'atorvastatin': { rxnorm: '308056', display: 'Atorvastatin 20 MG Oral Tablet', dose: '20mg at bedtime' },
    'morphine': { rxnorm: '7052', display: 'Morphine sulfate 10 MG/ML Injectable Solution', dose: '5mg IV push stat' },
    'amoxicillin': { rxnorm: '723', display: 'Amoxicillin 500 MG Oral Capsule', dose: '500mg tid' },
  },
  labObservations: {
    'glucose': { loinc: '1558-6', display: 'Fasting Glucose [Mass/volume] in Serum or Plasma', unit: 'mmol/L', normalRange: '4.0 - 7.0' },
    'hba1c': { loinc: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', unit: '%', normalRange: '4.0 - 5.6' },
    'creatinine': { loinc: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma', unit: 'umol/L', normalRange: '60 - 110' },
    'hemoglobin': { loinc: '718-7', display: 'Hemoglobin [Mass/volume] in Blood', unit: 'g/dL', normalRange: '13.0 - 17.0' },
  },
};

module.exports = {
  ONTOLOGY_MAP,
};
