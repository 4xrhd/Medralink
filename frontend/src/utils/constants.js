export const DEMO_CONSTANTS = {
  DEFAULT_PATIENT_REF_HASH: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  DEFAULT_CLINICIAN_ID: 'DR-RAHMAN-8821',
  DEFAULT_EMERGENCY_CLINICIAN_ID: 'DR-EMERGENCY-02',
  DEFAULT_AUDITOR_ID: 'AUDITOR-DGHS-01',
  DEFAULT_ORG: 'Org1MSP',
  CONSENT_PURPOSES: [
    { value: 'treatment', label: 'Direct Clinical Treatment (PDPO §12)' },
    { value: 'emergency', label: 'Emergency Break-Glass Override (PDPO §24)' },
    { value: 'audit', label: 'Regulatory & Forensic Audit (DGHS)' },
    { value: 'research-opt-in', label: 'Anonymized Research (Explicit Opt-In)' },
  ],
  AVAILABLE_SCOPES: [
    { value: 'PatientSummary', label: 'Patient Core Summary' },
    { value: 'Condition', label: 'Diagnosed Conditions' },
    { value: 'MedicationRequest', label: 'Medication Orders & Prescriptions' },
    { value: 'Observation', label: 'Lab Results & Vitals' },
    { value: 'AllergyIntolerance', label: 'Allergies & Adverse Reactions' },
  ],
};
