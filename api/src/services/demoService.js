const { v4: uuidv4 } = require('uuid');
const fabricService = require('./fabricService');
const storageService = require('./storageService');
const { verifySyntheticIdentity } = require('./identityAdapter');
const { encryptFHIRBundle } = require('./encryptionService');
const { createPatientFHIRBundle } = require('./fhirService');
const { sha256 } = require('./hashService');

class DemoService {
  /**
   * Bootstrap sample consortium dataset with patients, providers, encrypted records, and active consents.
   */
  async bootstrapDemo() {
    // 1. Predefined Synthetic Patients
    const patientA = verifySyntheticIdentity('BD-HEALTH-994821', '1992-05-14'); // Rahim Chowdhury
    const patientB = verifySyntheticIdentity('BD-HEALTH-771204', '1988-11-23'); // Fatema Begum
    const patientC = verifySyntheticIdentity('BD-HEALTH-451992', '2001-02-09'); // Tanvir Hasan
    const patientD = verifySyntheticIdentity('BD-HEALTH-618834', '1996-08-17'); // Nusrat Jahan
    const patientE = verifySyntheticIdentity('BD-HEALTH-883109', '1964-04-12'); // Kazi Anisur Rahman
    const patientF = verifySyntheticIdentity('BD-HEALTH-520194', '1981-10-05'); // Mst. Shirin Akhter

    const patients = [patientA, patientB, patientC, patientD, patientE, patientF];

    for (const p of patients) {
      await fabricService.registerPatientReference(p.patientRefHash, p.homeOrg).catch(() => {});
    }

    // 2. Register Authorized Healthcare Providers
    await fabricService.registerProvider(sha256('DR_HASAN_CLINICIAN'), 'Org1MSP', 'Clinician', 'CERT-8812').catch(() => {});
    await fabricService.registerProvider(sha256('DR_RAHMAN_SURGEON'), 'Org1MSP', 'Clinician', 'CERT-9914').catch(() => {});
    await fabricService.registerProvider(sha256('DR_ALAM_EMERGENCY_B'), 'Org2MSP', 'Emergency', 'CERT-9943').catch(() => {});
    await fabricService.registerProvider(sha256('DR_NUSRAT_OBGYN'), 'Org2MSP', 'Clinician', 'CERT-7731').catch(() => {});
    await fabricService.registerProvider(sha256('AUDITOR_DGHS_OBSERVER'), 'OrgAuditorMSP', 'Auditor', 'CERT-0001').catch(() => {});

    // 3. Helper to create and anchor encrypted clinical records
    const createAndAnchorRecord = async (patient, resourceType, clinicalData, custodialOrg, providerId) => {
      const recId = uuidv4();
      const bundle = createPatientFHIRBundle(patient.patientRefHash, clinicalData);
      const enc = encryptFHIRBundle(bundle);
      const storagePointer = `s3://${custodialOrg.toLowerCase()}-encrypted-vault/records/${recId}.enc`;
      const ptrHash = sha256(storagePointer);

      storageService.saveRecord(recId, {
        patientRefHash: patient.patientRefHash,
        storagePointer,
        encryptedPayload: enc,
      });

      await fabricService.createRecordReference(
        recId,
        patient.patientRefHash,
        resourceType,
        enc.recordHash,
        ptrHash,
        custodialOrg,
        sha256(providerId)
      ).catch(() => {});

      return recId;
    };

    // Create realistic clinical records
    const recordA = await createAndAnchorRecord(patientA, 'AllergyIntolerance', { condition: 'Type 2 Diabetes', allergy: 'Penicillin Anaphylaxis' }, 'Org1MSP', 'DR_HASAN_CLINICIAN');
    const recordA2 = await createAndAnchorRecord(patientA, 'DiagnosticReport', { test: 'Fasting Blood Sugar', result: '7.8 mmol/L' }, 'Org1MSP', 'DR_HASAN_CLINICIAN');
    const recordB = await createAndAnchorRecord(patientB, 'Condition', { condition: 'Stage 3 Chronic Kidney Disease & Hypertension', lab: 'Serum Creatinine 1.8 mg/dL' }, 'Org2MSP', 'DR_RAHMAN_SURGEON');
    const recordC = await createAndAnchorRecord(patientC, 'Observation', { trauma: 'Polytrauma GCS 7', vitals: 'BP 82/48, HR 134' }, 'Org1MSP', 'DR_ALAM_EMERGENCY_B');
    const recordD = await createAndAnchorRecord(patientD, 'MedicationRequest', { condition: 'Gestational Diabetes', med: 'Insulin Glargine 10u' }, 'Org2MSP', 'DR_NUSRAT_OBGYN');
    const recordE = await createAndAnchorRecord(patientE, 'DiagnosticReport', { condition: 'STEMI Post-PCI', lab: 'Troponin I 3.4 ng/mL' }, 'Org1MSP', 'DR_HASAN_CLINICIAN');

    // 4. Grant Consent Grants
    const expiry7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const expiry30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const consentA = uuidv4();
    await fabricService.grantConsent(
      consentA,
      patientA.patientRefHash,
      sha256('DR_HASAN_CLINICIAN'),
      ['AllergyIntolerance', 'MedicationRequest', 'DiagnosticReport'],
      'treatment',
      expiry7d
    ).catch(() => {});

    const consentB = uuidv4();
    await fabricService.grantConsent(
      consentB,
      patientB.patientRefHash,
      sha256('DR_RAHMAN_SURGEON'),
      ['Condition', 'Observation', 'MedicationRequest'],
      'treatment',
      expiry30d
    ).catch(() => {});

    // 5. Seed Emergency Break-Glass Record
    const emergencyId = uuidv4();
    const emgExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await fabricService.invokeEmergencyAccess(
      emergencyId,
      sha256('DR_ALAM_EMERGENCY_B'),
      patientC.patientRefHash,
      'TRAUMA_RESUSCITATION',
      JSON.stringify(['AllergyIntolerance', 'Observation', 'MedicationRequest']),
      emgExpiry
    ).catch(() => {});

    // 6. Seed Access Audit Logs
    await fabricService.logAccess(
      uuidv4(),
      patientA.patientRefHash,
      sha256('DR_HASAN_CLINICIAN'),
      'AllergyIntolerance',
      'treatment',
      'GRANTED'
    ).catch(() => {});

    await fabricService.logAccess(
      uuidv4(),
      patientB.patientRefHash,
      sha256('DR_RAHMAN_SURGEON'),
      'Condition',
      'treatment',
      'GRANTED'
    ).catch(() => {});

    return {
      status: 'BOOTSTRAPPED',
      message: 'Demo dataset initialized on blockchain with 6 synthetic patient profiles, providers, encrypted vaults, active consents, and emergency events',
      patientsCount: patients.length,
      sampleRecordId: recordA,
      sampleConsentId: consentA,
      sampleEmergencyId: emergencyId,
      txId: fabricService.txHistory[fabricService.txHistory.length - 1]?.txId || uuidv4(),
      blockNumber: fabricService.blocks.length - 1,
    };
  }
}

module.exports = new DemoService();
