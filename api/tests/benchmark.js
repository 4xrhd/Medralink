const { performance } = require('perf_hooks');
const { encryptFHIRBundle, decryptFHIRBundle } = require('../src/services/encryptionService');
const { createPatientFHIRBundle } = require('../src/services/fhirService');
const fabricService = require('../src/services/fabricService');
const agentsService = require('../src/services/agentsService');
const { runFHIRAgent } = require('../src/services/agents/fhirAgent');
const { runConsentAgent } = require('../src/services/agents/consentAgent');
const { runEmergencyTriageAgent } = require('../src/services/agents/emergencyTriageAgent');
const { runMedraLinkOrchestrator } = require('../src/services/agents/orchestrator');
const { runAuditAgent } = require('../src/services/agents/auditAgent');

// Synthetic baseline patient hash
const SAMPLE_PATIENT_REF = 'fda5b688aa81dcbe7cbdfbf39a816193933570aa9fe6377bfde16716eab2071c';

function calculatePercentiles(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
  return { avg, p50, p95, p99 };
}

async function runBenchmark(name, iterations, fn) {
  // Warmup
  for (let i = 0; i < Math.min(50, iterations); i++) {
    await fn();
  }

  const latencies = [];
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    latencies.push(performance.now() - t0);
  }

  const totalTime = performance.now() - start;
  const opsPerSec = Math.round((iterations / (totalTime / 1000)));
  const stats = calculatePercentiles(latencies);

  console.log(`\n📊 Benchmark: ${name} (${iterations} iterations)`);
  console.log(`   Throughput:  ${opsPerSec.toLocaleString()} ops/sec`);
  console.log(`   Avg Latency: ${stats.avg.toFixed(3)} ms`);
  console.log(`   p50 Latency: ${stats.p50.toFixed(3)} ms`);
  console.log(`   p95 Latency: ${stats.p95.toFixed(3)} ms`);
  console.log(`   p99 Latency: ${stats.p99.toFixed(3)} ms`);

  return { name, iterations, opsPerSec, ...stats };
}

async function main() {
  console.log('================================================================');
  console.log(' 🚀 MedraLink Full-Stack Performance Benchmark Suite');
  console.log('================================================================');

  const bundle = createPatientFHIRBundle(SAMPLE_PATIENT_REF, { gender: 'male', birthDate: '1990-01-01' });
  const encryptedPayload = encryptFHIRBundle(bundle);

  // Bootstrap dummy state
  await fabricService.registerPatientReference(SAMPLE_PATIENT_REF, 'mock-id-hash');
  const consentRes = await fabricService.grantConsent(
    'bench-consent-1',
    SAMPLE_PATIENT_REF,
    'DR_RAHMAN_SURGEON',
    ['AllergyIntolerance', 'MedicationRequest'],
    'treatment',
    '2030-01-01T00:00:00Z'
  );

  const results = [];

  // 1. FHIR Bundle Creation & AES-256-GCM Envelope Encryption
  results.push(await runBenchmark('AES-256-GCM FHIR Encryption', 1000, () => {
    encryptFHIRBundle(bundle);
  }));

  // 2. AES-256-GCM Envelope Decryption
  results.push(await runBenchmark('AES-256-GCM FHIR Decryption', 1000, () => {
    decryptFHIRBundle(encryptedPayload);
  }));

  // 3. Dynamic Consent Policy Evaluation
  results.push(await runBenchmark('ConsentAgent Policy Evaluator', 1000, () => {
    runConsentAgent({
      activeConsent: consentRes.consent,
      patientRefHash: SAMPLE_PATIENT_REF,
      requesterId: 'DR_RAHMAN_SURGEON',
      requesterRole: 'Clinician',
      requestedScope: 'AllergyIntolerance',
      purpose: 'treatment',
    });
  }));

  // 4. FHIRAgent Semantic Normalization
  results.push(await runBenchmark('FHIRAgent Semantic Normalization', 1000, () => {
    runFHIRAgent({
      patientRefHash: SAMPLE_PATIENT_REF,
      rawNotes: 'Patient has severe penicillin allergy and takes metformin 500mg daily.',
      labResults: { glucose: '5.8', hba1c: '5.2' },
    });
  }));

  // 5. Emergency Triage Calculation & Vital Validation
  results.push(await runBenchmark('EmergencyTriage Vital Validation', 1000, () => {
    runEmergencyTriageAgent({
      patientRefHash: SAMPLE_PATIENT_REF,
      reasonCode: 'UNCONSCIOUS_TRAUMA',
      vitals: { gcs: 7, sbp: 85, hr: 125, spo2: 88 },
      clinicianMfa: true,
    });
  }));

  // 6. Master DAG Orchestration
  results.push(await runBenchmark('MedraLinkOrchestrator Master DAG Pipeline', 500, async () => {
    await runMedraLinkOrchestrator({
      workflowType: 'CLINICAL_INTAKE_AND_RECORD_ANCHOR',
      inputPayload: {
        patientRefHash: SAMPLE_PATIENT_REF,
        rawNotes: 'Routine follow-up for diabetes and hypertension.',
        labResults: { glucose: '6.2' },
      },
    });
  }));

  // 7. Forensic Ledger & SIEM Scan
  results.push(await runBenchmark('AuditAgent Forensic Ledger Scan', 500, async () => {
    runAuditAgent({
      blocks: fabricService.blocks,
      emergencyEvents: await fabricService.getAllEmergencyEvents(),
    });
  }));

  console.log('\n================================================================');
  console.log(' ✅ Benchmark Suite Completed Successfully');
  console.log('================================================================');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runBenchmark };
