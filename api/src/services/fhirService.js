const { v4: uuidv4 } = require('uuid');

/**
 * FHIR R4 Bundle Constructor for MedraLink
 * Speaks standard HL7 FHIR JSON format.
 */

function createPatientFHIRBundle(patientRefHash, clinicalData = {}) {
  const bundleId = uuidv4();
  const timestamp = new Date().toISOString();

  const entries = [];

  // 1. FHIR Patient Resource (Pseudonymized)
  entries.push({
    fullUrl: `urn:uuid:${uuidv4()}`,
    resource: {
      resourceType: 'Patient',
      id: patientRefHash.substring(0, 16),
      identifier: [
        {
          system: 'https://medralink.dghs.gov.bd/fhir/patient-ref-hash',
          value: patientRefHash,
        },
      ],
      active: true,
      gender: clinicalData.gender || 'unknown',
      birthDate: clinicalData.birthDate || '1992-05-14',
    },
  });

  // 2. FHIR AllergyIntolerance Resource (e.g. Penicillin severe anaphylaxis)
  entries.push({
    fullUrl: `urn:uuid:${uuidv4()}`,
    resource: {
      resourceType: 'AllergyIntolerance',
      id: uuidv4(),
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
            code: 'active',
            display: 'Active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
            code: 'confirmed',
            display: 'Confirmed',
          },
        ],
      },
      type: 'allergy',
      category: ['medication'],
      criticality: 'high',
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '373270004',
            display: 'Penicillin - substance with penicillin structure',
          },
        ],
        text: 'Penicillin (Severe Anaphylaxis Risk)',
      },
      patient: {
        reference: `Patient/${patientRefHash.substring(0, 16)}`,
      },
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '39579001',
                  display: 'Anaphylaxis',
                },
              ],
              text: 'Severe Anaphylactic Shock & Bronchospasm',
            },
          ],
          severity: 'severe',
        },
      ],
    },
  });

  // 3. FHIR MedicationRequest Resource (e.g. Metformin for Type 2 Diabetes)
  entries.push({
    fullUrl: `urn:uuid:${uuidv4()}`,
    resource: {
      resourceType: 'MedicationRequest',
      id: uuidv4(),
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [
          {
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: '860975',
            display: 'Metformin hydrochloride 500 MG Oral Tablet',
          },
        ],
        text: 'Metformin 500mg daily (Oral)',
      },
      subject: {
        reference: `Patient/${patientRefHash.substring(0, 16)}`,
      },
      dosageInstruction: [
        {
          text: '500 mg orally once daily with meals',
        },
      ],
    },
  });

  // 4. FHIR DiagnosticReport Resource (e.g. Fasting Blood Sugar Lab Test)
  entries.push({
    fullUrl: `urn:uuid:${uuidv4()}`,
    resource: {
      resourceType: 'DiagnosticReport',
      id: uuidv4(),
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: 'LAB',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '1558-6',
            display: 'Fasting Glucose [Mass/volume] in Serum or Plasma',
          },
        ],
        text: 'Fasting Blood Glucose Test',
      },
      subject: {
        reference: `Patient/${patientRefHash.substring(0, 16)}`,
      },
      effectiveDateTime: timestamp,
      conclusion: 'Elevated fasting blood sugar (7.8 mmol/L). Consistent with mild diabetes mellitus.',
    },
  });

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'collection',
    timestamp,
    meta: {
      tag: [
        {
          system: 'https://medralink.dghs.gov.bd/tags',
          code: 'SYNTHETIC_DATA',
          display: 'Synthetic Clinical Data - MedraLink Demonstration',
        },
      ],
    },
    entry: entries,
  };
}

module.exports = {
  createPatientFHIRBundle,
};
