const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fabricService = require('../services/fabricService');
const { encryptFHIRBundle, decryptFHIRBundle } = require('../services/encryptionService');
const { createPatientFHIRBundle } = require('../services/fhirService');
const { sha256 } = require('../services/hashService');
const { requireRole } = require('../middleware/roleGuard');
const storageService = require('../services/storageService');

// POST /records - Create encrypted FHIR record and anchor hash on blockchain
router.post('/', requireRole('Clinician', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, recordType, clinicalData, custodialOrg } = req.body;
    if (!patientRefHash || !recordType) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'patientRefHash and recordType are required' }],
      });
    }

    const recordId = uuidv4();

    // 1. Generate standard FHIR R4 Bundle
    const fhirBundle = createPatientFHIRBundle(patientRefHash, clinicalData || {});

    // 2. Encrypt off-chain using AES-256-GCM
    const encryptedPayload = encryptFHIRBundle(fhirBundle);

    // 3. Store encrypted ciphertext in custodial hospital storage bucket
    const storagePointer = `s3://hospital-a-encrypted-vault/records/${recordId}.enc`;
    const opaquePointerHash = sha256(storagePointer);
    storageService.saveRecord(recordId, {
      patientRefHash,
      storagePointer,
      encryptedPayload,
    });

    // 4. Anchor cryptographic hashes on Hyperledger Fabric ledger
    const result = await fabricService.createRecordReference(
      recordId,
      patientRefHash,
      recordType,
      encryptedPayload.recordHash,
      opaquePointerHash,
      custodialOrg || req.user.mspId || 'Org1MSP',
      req.user.id || 'PROV_DOCTOR_A'
    );

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Clinical record encrypted off-chain and cryptographic hash anchored on blockchain',
      recordId,
      recordType,
      recordHash: encryptedPayload.recordHash,
      opaquePointerHash,
      algorithm: encryptedPayload.algorithm,
      txId: result.txId,
      blockNumber: result.blockNumber,
      warning: 'SYNTHETIC DATA — ZERO PII STORED ON-CHAIN',
    });
  } catch (err) {
    next(err);
  }
});

// GET /records/:id - Retrieve and decrypt clinical record (Requires valid consent check)
router.get('/:id', requireRole('Clinician', 'Emergency', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { consentId, patientRefHash, scope, purpose } = req.query;

    const recordRef = await fabricService.getRecordReference(id);
    if (!recordRef) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found', diagnostics: `Record reference '${id}' not found on ledger` }],
      });
    }

    let auditLogResult = null;
    // If regular clinician access (non-admin), verify consent on-chain
    if (req.user.role === 'Clinician') {
      if (!consentId) {
        return res.status(403).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'forbidden', diagnostics: 'consentId query parameter is required for clinician access' }],
        });
      }

      const requestId = uuidv4();
      const accessCheck = await fabricService.requestAccess(
        requestId,
        recordRef.patientRefHash,
        consentId,
        req.user.id || 'clinician_user',
        recordRef.recordType,
        purpose || 'treatment'
      );

      // Log access attempt on ledger
      auditLogResult = await fabricService.logAccess(
        requestId,
        recordRef.patientRefHash,
        req.user.id || 'clinician_user',
        recordRef.recordType,
        purpose || 'treatment',
        accessCheck.status
      );

      if (!accessCheck.allowed) {
        return res.status(403).json({
          resourceType: 'OperationOutcome',
          issue: [{ severity: 'error', code: 'forbidden', diagnostics: `Access denied: ${accessCheck.reason} [Status: ${accessCheck.status}]` }],
        });
      }
    } else if (req.user.role === 'Emergency') {
      const emergencyId = req.query.emergencyId;
      if (emergencyId) {
        const emgEvent = fabricService.worldState.get(`EMERGENCY_${emergencyId}`);
        if (!emgEvent) {
          return res.status(403).json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'forbidden', diagnostics: `Emergency authorization token '${emergencyId}' not found on ledger` }],
          });
        }
        const now = new Date();
        const expiry = new Date(emgEvent.expiryTimestamp);
        if (now > expiry) {
          return res.status(403).json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'forbidden', diagnostics: 'Emergency break-glass authorization window has expired (60 min limit)' }],
          });
        }
      }
      // Auto-log emergency access attempt
      auditLogResult = await fabricService.logAccess(
        uuidv4(),
        recordRef.patientRefHash,
        req.user.id || 'emergency_clinician',
        recordRef.recordType,
        'emergency',
        'GRANTED_EMERGENCY_DECRYPTION'
      );
    }

    // Retrieve off-chain encrypted ciphertext
    const stored = storageService.getRecord(id);
    if (!stored) {
      return res.status(404).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Encrypted off-chain payload not found in custodial repository' }],
      });
    }

    // Decrypt FHIR bundle
    const decryptedFHIR = decryptFHIRBundle(stored.encryptedPayload);

    res.json({
      status: 'AUTHORIZED',
      recordId: id,
      recordType: recordRef.recordType,
      recordHash: recordRef.recordHash,
      custodialOrg: recordRef.custodialOrg,
      fhirBundle: decryptedFHIR,
      txId: auditLogResult?.txId || uuidv4(),
      blockNumber: auditLogResult?.blockNumber || 1,
    });
  } catch (err) {
    next(err);
  }
});

// GET /records/patient/:patientRefHash - List all record references for a patient
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const records = await fabricService.getRecordsByPatient(req.params.patientRefHash);
    res.json({
      patientRefHash: req.params.patientRefHash,
      count: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
