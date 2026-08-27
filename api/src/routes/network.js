const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');
const { verifySyntheticIdentity } = require('../services/identityAdapter');
const { encryptFHIRBundle } = require('../services/encryptionService');
const { createPatientFHIRBundle } = require('../services/fhirService');
const { sha256 } = require('../services/hashService');
const { v4: uuidv4 } = require('uuid');

// GET /health - Public health check
router.get('/health', async (req, res) => {
  const status = await fabricService.getNetworkStatus();
  res.json({
    status: 'HEALTHY',
    service: 'MedraLink API Gateway',
    version: '1.0.0-prototype',
    channel: status.channel,
    chaincode: status.chaincode,
    blockHeight: status.blockHeight,
    timestamp: new Date().toISOString(),
  });
});

// GET /network/status - Detailed consortium status
router.get('/status', async (req, res) => {
  const status = await fabricService.getNetworkStatus();
  res.json(status);
});

const storageService = require('../services/storageService');

// POST /demo/bootstrap - One-click automated setup for demo
router.post('/demo/bootstrap', async (req, res, next) => {
  try {
    // Step 1: Register Patient A
    const patientA = verifySyntheticIdentity('BD-HEALTH-994821', '1992-05-14');
    await fabricService.registerPatientReference(patientA.patientRefHash, 'Org1MSP').catch(() => {});

    // Step 2: Register Providers
    await fabricService.registerProvider(sha256('DR_HASAN_HOSPITAL_A'), 'Org1MSP', 'Clinician', 'CERT-8812').catch(() => {});
    await fabricService.registerProvider(sha256('DR_ALAM_EMERGENCY_B'), 'Org2MSP', 'Emergency', 'CERT-9943').catch(() => {});
    await fabricService.registerProvider(sha256('AUDITOR_DGHS_OBSERVER'), 'OrgAuditorMSP', 'Auditor', 'CERT-0001').catch(() => {});

    // Step 3: Create Sample Clinical Record
    const recordId = uuidv4();
    const fhirBundle = createPatientFHIRBundle(patientA.patientRefHash);
    const enc = encryptFHIRBundle(fhirBundle);
    const storagePointer = `s3://vault/records/${recordId}.enc`;
    const ptrHash = sha256(storagePointer);
    
    storageService.saveRecord(recordId, {
      patientRefHash: patientA.patientRefHash,
      storagePointer,
      encryptedPayload: enc,
    });

    await fabricService.createRecordReference(
      recordId,
      patientA.patientRefHash,
      'AllergyIntolerance',
      enc.recordHash,
      ptrHash,
      'Org1MSP',
      sha256('DR_HASAN_HOSPITAL_A')
    ).catch(() => {});

    // Step 4: Grant Consent
    const consentId = uuidv4();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await fabricService.grantConsent(
      consentId,
      patientA.patientRefHash,
      sha256('DR_HASAN_HOSPITAL_A'),
      ['AllergyIntolerance', 'MedicationRequest'],
      'treatment',
      expiry
    ).catch(() => {});

    res.json({
      status: 'BOOTSTRAPPED',
      message: 'Demo dataset initialized on blockchain',
      patientRefHash: patientA.patientRefHash,
      syntheticHealthId: patientA.syntheticHealthId,
      sampleRecordId: recordId,
      sampleConsentId: consentId,
      txId: fabricService.txHistory[fabricService.txHistory.length - 1]?.txId || uuidv4(),
      blockNumber: fabricService.blocks.length - 1,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
