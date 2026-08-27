const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/server');

let server;
let baseUrl;

test.before((t, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-demo-role': options.role || 'Admin',
      ...(options.headers || {}),
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test('1. Health Check Endpoint', async () => {
  const { status, data } = await apiRequest('/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'HEALTHY');
  assert.equal(data.channel, 'medralink-main');
});

test('2. Network Status Endpoint', async () => {
  const { status, data } = await apiRequest('/status');
  assert.equal(status, 200);
  assert.equal(data.status, 'ONLINE');
  assert.equal(data.organizations.length, 4);
  assert.equal(data.consensus, 'CFT Raft (3 Nodes)');
});

test('3. Synthetic Patient Registration (Mock Identity Adapter)', async () => {
  const { status, data } = await apiRequest('/patients/register', {
    method: 'POST',
    body: {
      syntheticId: 'BD-HEALTH-994821',
      dob: '1992-05-14',
      homeOrg: 'Org1MSP',
    },
  });
  assert.equal(status, 201);
  assert.ok(data.patientRefHash);
  assert.ok(data.txId);
  assert.ok(data.blockNumber >= 1);
});

test('4. Provider Registration (RegisterProvider on Ledger)', async () => {
  const { status, data } = await apiRequest('/providers/register', {
    method: 'POST',
    role: 'Admin',
    body: {
      providerId: 'DR_RAHMAN_SURGEON',
      org: 'Org1MSP',
      role: 'Clinician',
    },
  });
  assert.equal(status, 201);
  assert.ok(data.providerIdHash);
  assert.ok(data.txId);
});

test('5. Off-Chain Encrypted Record Creation & On-Chain Hash Anchoring', async () => {
  // First register patient
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-771204', dob: '1988-11-23' },
  });

  const { status, data } = await apiRequest('/records', {
    method: 'POST',
    role: 'Clinician',
    body: {
      patientRefHash: pat.data.patientRefHash,
      recordType: 'AllergyIntolerance',
    },
  });

  assert.equal(status, 201);
  assert.ok(data.recordId);
  assert.ok(data.recordHash);
  assert.equal(data.algorithm, 'aes-256-gcm');
});

test('6. Full Consent -> Access -> Decryption -> Revoke -> Denied Access Lifecycle', async () => {
  // 1. Patient registration
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-451992', dob: '2001-02-09' },
  });
  const patientRefHash = pat.data.patientRefHash;

  // 2. Create encrypted record
  const recRes = await apiRequest('/records', {
    method: 'POST',
    role: 'Clinician',
    body: {
      patientRefHash,
      recordType: 'AllergyIntolerance',
    },
  });
  assert.equal(recRes.status, 201);
  const recordId = recRes.data.recordId;

  // 3. Grant Consent
  const consentRes = await apiRequest('/consents', {
    method: 'POST',
    role: 'Patient',
    body: {
      patientRefHash,
      grantee: 'DR_HASAN_CLINICIAN',
      scope: ['AllergyIntolerance', 'MedicationRequest'],
      purpose: 'treatment',
      expiryDays: 7,
    },
  });
  assert.equal(consentRes.status, 201);
  const consentId = consentRes.data.consentId;

  // 4. Request Access & Decrypt FHIR Resource
  const getRecRes = await apiRequest(`/records/${recordId}?consentId=${consentId}&purpose=treatment`, {
    role: 'Clinician',
  });
  assert.equal(getRecRes.status, 200);
  assert.equal(getRecRes.data.status, 'AUTHORIZED');
  assert.ok(getRecRes.data.fhirBundle);
  assert.equal(getRecRes.data.fhirBundle.resourceType, 'Bundle');

  // 5. Revoke Consent
  const revokeRes = await apiRequest(`/consents/${consentId}`, {
    method: 'DELETE',
    role: 'Patient',
    body: { patientRefHash },
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.data.revoked, true);

  // 6. Request Access After Revocation (Must be Denied)
  const deniedAccess = await apiRequest(`/records/${recordId}?consentId=${consentId}&purpose=treatment`, {
    role: 'Clinician',
  });
  assert.equal(deniedAccess.status, 403);
});

test('7. Emergency Break-Glass Invocation and Auditor Review', async () => {
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-888999', dob: '1975-08-12' },
  });

  // Emergency Break-Glass
  const emgRes = await apiRequest('/emergency/invoke', {
    method: 'POST',
    role: 'Emergency',
    body: {
      patientRefHash: pat.data.patientRefHash,
      reasonCode: 'UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS',
      scope: ['AllergyIntolerance'],
      expiryMinutes: 60,
    },
  });
  assert.equal(emgRes.status, 201);
  assert.equal(emgRes.data.reviewStatus, 'PENDING');
  const emergencyId = emgRes.data.emergencyId;

  // Auditor Review
  const reviewRes = await apiRequest('/emergency/review', {
    method: 'POST',
    role: 'Auditor',
    body: {
      emergencyId,
      reviewStatus: 'APPROPRIATE',
      findingsNote: 'Clinician acted appropriately under emergency protocol B-04',
    },
  });
  assert.equal(reviewRes.status, 200);
  assert.equal(reviewRes.data.reviewStatus, 'APPROPRIATE');

  // Immutable Audit Trail Check
  const auditRes = await apiRequest(`/audit/${pat.data.patientRefHash}`);
  assert.equal(auditRes.status, 200);
  assert.ok(auditRes.data.eventCount >= 1);
});

test('8. Demo Consortium State Bootstrap Endpoint', async () => {
  const { status, data } = await apiRequest('/demo/bootstrap', {
    method: 'POST',
    role: 'Admin',
  });
  assert.equal(status, 200);
  assert.equal(data.status, 'BOOTSTRAPPED');
  assert.ok(data.sampleRecordId);
  assert.ok(data.sampleConsentId);
});

test('9. Agentic AI Status & Ontology Endpoints', async () => {
  const { status, data } = await apiRequest('/agents/status');
  assert.equal(status, 200);
  assert.equal(data.status, 'ACTIVE');
  assert.equal(data.agents.length, 5);

  const ont = await apiRequest('/agents/ontology');
  assert.equal(ont.status, 200);
  assert.ok(ont.data.allergies.penicillin);
  assert.ok(ont.data.medications.metformin);
});

test('10. FHIRAgent Semantic Ontology Normalization', async () => {
  const { status, data } = await apiRequest('/agents/fhir-normalize', {
    method: 'POST',
    body: {
      patientRefHash: 'a1b2c3d4e5f60000111122223333444455556666777788889999aaaabbbbcccc',
      rawNotes: 'Patient has known severe penicillin anaphylaxis and takes metformin 500mg daily for diabetes.',
      labResults: { glucose: 7.8, hba1c: 6.9 },
    },
  });
  assert.equal(status, 200);
  assert.equal(data.agent, 'FHIRAgent');
  assert.equal(data.status, 'NORMALIZED');
  assert.ok(data.ontologySummary.snomedCount >= 1);
  assert.ok(data.ontologySummary.rxnormCount >= 1);
  assert.ok(data.ontologySummary.loincCount >= 1);
  assert.equal(data.bundle.resourceType, 'Bundle');
});

test('11. ConsentAgent Dynamic Policy Evaluation', async () => {
  // Test case A: Deny without consent
  const denyRes = await apiRequest('/agents/consent-evaluate', {
    method: 'POST',
    body: {
      patientRefHash: 'dummy-hash',
      requesterId: 'DR-ANWAR',
      requesterRole: 'Clinician',
      requestedScope: 'CLINICAL_RECORDS',
      purpose: 'DIRECT_TREATMENT',
    },
  });
  assert.equal(denyRes.status, 200);
  assert.equal(denyRes.data.policyDecision, 'DENY');
  assert.equal(denyRes.data.verdict, 'DENIED_NO_CONSENT');

  // Test case B: Allow with active consent
  const allowRes = await apiRequest('/agents/consent-evaluate', {
    method: 'POST',
    body: {
      patientRefHash: 'dummy-hash',
      requesterId: 'DR-ANWAR',
      requesterRole: 'Clinician',
      requestedScope: 'CLINICAL_RECORDS',
      purpose: 'DIRECT_TREATMENT',
      activeConsent: {
        consentId: 'CONSENT-1001',
        scope: ['CLINICAL_RECORDS'],
        purpose: 'DIRECT_TREATMENT',
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600,
        revoked: false,
      },
    },
  });
  assert.equal(allowRes.status, 200);
  assert.equal(allowRes.data.policyDecision, 'ALLOW');
  assert.equal(allowRes.data.verdict, 'PERMITTED_ACTIVE_CONSENT');
});

test('12. EmergencyTriageAgent Trauma Assessment & Token Issuance', async () => {
  const { status, data } = await apiRequest('/agents/emergency-triage', {
    method: 'POST',
    body: {
      clinicianId: 'DR-EMERGENCY-01',
      patientRefHash: 'trauma-patient-hash-778899',
      traumaVitals: { gcs: 6, systolicBP: 80, diastolicBP: 45, heartRate: 138, spo2: 86 },
      declaredReasonCode: 'UNCONSCIOUS_TRAUMA_PATIENT',
      locationOrg: 'Org2MSP',
    },
  });
  assert.equal(status, 200);
  assert.equal(data.decision, 'EMERGENCY_ACCESS_APPROVED');
  assert.equal(data.esiLevel, 1);
  assert.ok(data.breakGlassToken.tokenId.startsWith('EMG-'));
  assert.equal(data.breakGlassToken.expiryTimestamp > Math.floor(Date.now() / 1000), true);
});

test('13. MedraLinkOrchestrator Master DAG Execution', async () => {
  const { status, data } = await apiRequest('/agents/orchestrate', {
    method: 'POST',
    body: {
      workflowType: 'CLINICAL_INTAKE_AND_RECORD_ANCHOR',
      inputPayload: {
        patientRefHash: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
        rawNotes: 'Emergency patient allergic to penicillin on metformin',
        clinicianId: 'DR-RAHMAN-8821',
        activeConsent: {
          consentId: 'CONSENT-DAG-1',
          scope: ['CLINICAL_RECORDS'],
          purpose: 'DIRECT_TREATMENT',
          expiryTimestamp: Math.floor(Date.now() / 1000) + 7200,
          revoked: false,
        },
      },
    },
  });
  assert.equal(status, 200);
  assert.equal(data.orchestratorStatus, 'SUCCESS');
  assert.ok(data.dagId.startsWith('DAG-'));
  assert.ok(data.dagExecutionSteps.length >= 4);
  assert.ok(data.results.fhirAgent);
  assert.ok(data.results.consentAgent);
});

test('14. AuditAgent Forensic Ledger Scan & Anomaly Detection', async () => {
  const { status, data } = await apiRequest('/agents/audit-scan', {
    method: 'POST',
    body: {},
  });
  assert.equal(status, 200);
  assert.equal(data.agent, 'AuditAgent');
  assert.equal(data.status, 'AUDIT_COMPLETE');
  assert.ok(typeof data.blocksScanned === 'number');
  assert.ok(data.dossierHash);
});

test('15. Patient Emergency Break-Glass History Query', async () => {
  // First register patient and invoke emergency
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-443322', dob: '1985-07-19' },
  });

  await apiRequest('/emergency/invoke', {
    method: 'POST',
    role: 'Emergency',
    body: {
      patientRefHash: pat.data.patientRefHash,
      reasonCode: 'UNCONSCIOUS_TRAUMA_PATIENT',
      scope: ['AllergyIntolerance', 'MedicationRequest'],
      expiryMinutes: 60,
    },
  });

  const { status, data } = await apiRequest(`/emergency/patient/${pat.data.patientRefHash}`);
  assert.equal(status, 200);
  assert.equal(data.patientRefHash, pat.data.patientRefHash);
  assert.ok(data.count >= 1);
  assert.equal(data.events[0].reasonCode, 'UNCONSCIOUS_TRAUMA_PATIENT');
});

test('16. Complete 6-Resource FHIR R4 Bundle Validation', async () => {
  const { createPatientFHIRBundle } = require('../src/services/fhirService');
  const bundle = createPatientFHIRBundle('hash_test_patient_123', { gender: 'male', birthDate: '1990-01-01' });

  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.type, 'collection');
  assert.equal(bundle.entry.length, 6);

  const resourceTypes = bundle.entry.map((e) => e.resource.resourceType);
  assert.ok(resourceTypes.includes('Patient'), 'Must include Patient');
  assert.ok(resourceTypes.includes('AllergyIntolerance'), 'Must include AllergyIntolerance');
  assert.ok(resourceTypes.includes('MedicationRequest'), 'Must include MedicationRequest');
  assert.ok(resourceTypes.includes('Condition'), 'Must include Condition');
  assert.ok(resourceTypes.includes('Observation'), 'Must include Observation');
  assert.ok(resourceTypes.includes('DiagnosticReport'), 'Must include DiagnosticReport');
});

test('17. Real-Time Blockchain SSE Event Stream Connection', async () => {
  const url = `${baseUrl}/events`;
  const res = await fetch(url);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/event-stream');

  const reader = res.body.getReader();
  const { value } = await reader.read();
  const text = new TextDecoder().decode(value);
  assert.ok(text.includes('CONNECTED'));
  assert.ok(text.includes('medralink-main'));
  await reader.cancel();
});

test('18. Standalone /access/request Verification Flow', async () => {
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-556677', dob: '1995-03-21' },
  });
  const patientRefHash = pat.data.patientRefHash;

  const conRes = await apiRequest('/consents', {
    method: 'POST',
    role: 'Patient',
    body: {
      patientRefHash,
      grantee: 'DR_HASAN_CLINICIAN',
      scope: ['AllergyIntolerance'],
      purpose: 'treatment',
      expiryDays: 3,
    },
  });
  const consentId = conRes.data.consentId;

  // Granted request
  const accessRes = await apiRequest('/access/request', {
    method: 'POST',
    role: 'Clinician',
    body: {
      patientRefHash,
      consentId,
      scope: 'AllergyIntolerance',
      purpose: 'treatment',
    },
  });
  assert.equal(accessRes.status, 200);
  assert.equal(accessRes.data.status, 'GRANTED');
  assert.equal(accessRes.data.verificationStatus, 'GRANTED');

  // Denied request (invalid purpose)
  const deniedRes = await apiRequest('/access/request', {
    method: 'POST',
    role: 'Clinician',
    body: {
      patientRefHash,
      consentId,
      scope: 'AllergyIntolerance',
      purpose: 'marketing',
    },
  });
  assert.equal(deniedRes.status, 403);
});

test('19. Tamper Detection & Cryptographic Hash Anchor Verification', async () => {
  const storageService = require('../src/services/storageService');

  // 1. Register patient
  const pat = await apiRequest('/patients/register', {
    method: 'POST',
    body: { syntheticId: 'BD-HEALTH-129933', dob: '1990-08-14' },
  });
  const patientRefHash = pat.data.patientRefHash;

  // 2. Create encrypted record
  const recRes = await apiRequest('/records', {
    method: 'POST',
    role: 'Clinician',
    body: {
      patientRefHash,
      recordType: 'AllergyIntolerance',
    },
  });
  const recordId = recRes.data.recordId;

  // 3. Grant consent
  const conRes = await apiRequest('/consents', {
    method: 'POST',
    role: 'Patient',
    body: {
      patientRefHash,
      grantee: 'DR_HASAN_CLINICIAN',
      scope: ['AllergyIntolerance'],
      purpose: 'treatment',
      expiryDays: 7,
    },
  });
  const consentId = conRes.data.consentId;

  // 4. Simulate off-chain custodial tampering by modifying stored ciphertext
  const stored = storageService.getRecord(recordId);
  assert.ok(stored);
  const originalCiphertext = stored.encryptedPayload.ciphertext;
  // Corrupt 1 hex character
  stored.encryptedPayload.ciphertext = originalCiphertext.substring(0, originalCiphertext.length - 2) + 'ff';

  // 5. Attempt retrieval - Must be rejected due to hash mismatch
  const tamperedFetch = await apiRequest(`/records/${recordId}?consentId=${consentId}&purpose=treatment`, {
    role: 'Clinician',
  });
  assert.equal(tamperedFetch.status, 500);
  assert.ok(
    tamperedFetch.data.issue[0].diagnostics.includes('integrity violation') ||
    tamperedFetch.data.issue[0].diagnostics.includes('mismatch')
  );

  // Restore for cleanliness
  stored.encryptedPayload.ciphertext = originalCiphertext;
});



