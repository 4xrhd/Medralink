const { v4: uuidv4 } = require('uuid');
const fabricService = require('./fabricService');
const { encryptFHIRBundle, decryptFHIRBundle } = require('./encryptionService');
const { createPatientFHIRBundle } = require('./fhirService');
const { sha256 } = require('./hashService');
const storageService = require('./storageService');
const { AppError, BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

class RecordAccessService {
  /**
   * Create an encrypted clinical record off-chain and anchor its cryptographic hash on the Fabric ledger.
   */
  async createEncryptedRecord({ patientRefHash, recordType, clinicalData, custodialOrg, user }) {
    if (!patientRefHash || !recordType) {
      throw new BadRequestError('patientRefHash and recordType are required');
    }

    const recordId = uuidv4();

    // 1. Generate standard HL7 FHIR R4 Bundle
    const fhirBundle = createPatientFHIRBundle(patientRefHash, clinicalData || {});

    // 2. Encrypt off-chain using AES-256-GCM
    const encryptedPayload = encryptFHIRBundle(fhirBundle);

    // 3. Store encrypted ciphertext in custodial repository
    const storagePointer = `s3://hospital-a-encrypted-vault/records/${recordId}.enc`;
    const opaquePointerHash = sha256(storagePointer);
    storageService.saveRecord(recordId, {
      patientRefHash,
      storagePointer,
      encryptedPayload,
    });

    // 4. Anchor cryptographic hashes on Hyperledger Fabric ledger
    const anchorResult = await fabricService.createRecordReference(
      recordId,
      patientRefHash,
      recordType,
      encryptedPayload.recordHash,
      opaquePointerHash,
      custodialOrg || user?.mspId || 'Org1MSP',
      user?.id || 'PROV_DOCTOR_A'
    );

    return {
      status: 'SUCCESS',
      message: 'Clinical record encrypted off-chain and cryptographic hash anchored on blockchain',
      recordId,
      recordType,
      recordHash: encryptedPayload.recordHash,
      opaquePointerHash,
      algorithm: encryptedPayload.algorithm,
      txId: anchorResult.txId,
      blockNumber: anchorResult.blockNumber,
      warning: 'SYNTHETIC DATA | ZERO PII STORED ON-CHAIN',
    };
  }

  /**
   * Authorize access, log on-chain, and decrypt record from custodial storage.
   */
  async getDecryptedRecord({ recordId, user, consentId, emergencyId, purpose }) {
    const recordRef = await fabricService.getRecordReference(recordId);
    if (!recordRef) {
      throw new NotFoundError(`Record reference '${recordId}' not found on ledger`);
    }

    let auditLogResult = null;

    if (user.role === 'Clinician') {
      if (!consentId) {
        throw new ForbiddenError('consentId query parameter is required for clinician access');
      }

      const requestId = uuidv4();
      const accessCheck = await fabricService.requestAccess(
        requestId,
        recordRef.patientRefHash,
        consentId,
        user.id || 'clinician_user',
        recordRef.recordType,
        purpose || 'treatment'
      );

      // Log access attempt on ledger
      auditLogResult = await fabricService.logAccess(
        requestId,
        recordRef.patientRefHash,
        user.id || 'clinician_user',
        recordRef.recordType,
        purpose || 'treatment',
        accessCheck.status
      );

      if (!accessCheck.allowed) {
        throw new ForbiddenError(`Access denied: ${accessCheck.reason} [Status: ${accessCheck.status}]`, accessCheck.status);
      }
    } else if (user.role === 'Patient') {
      // Patient accessing their own personal health record
      const requestId = uuidv4();
      auditLogResult = await fabricService.logAccess(
        requestId,
        recordRef.patientRefHash,
        user.id || 'patient_owner',
        recordRef.recordType,
        'patient-self-view',
        'GRANTED_PATIENT_OWNER'
      );
    } else if (user.role === 'Emergency') {
      if (emergencyId) {
        const emgEvent = fabricService.worldState.get(`EMERGENCY_${emergencyId}`);
        if (!emgEvent) {
          throw new ForbiddenError(`Emergency authorization token '${emergencyId}' not found on ledger`);
        }
        const now = new Date();
        const expiry = new Date(emgEvent.expiryTimestamp);
        if (now > expiry) {
          throw new ForbiddenError('Emergency break-glass authorization window has expired (60 min limit)');
        }
      }

      // Auto-log emergency access attempt
      auditLogResult = await fabricService.logAccess(
        uuidv4(),
        recordRef.patientRefHash,
        user.id || 'emergency_clinician',
        recordRef.recordType,
        'emergency',
        'GRANTED_EMERGENCY_DECRYPTION'
      );
    }

    // Retrieve off-chain encrypted ciphertext
    const stored = storageService.getRecord(recordId);
    if (!stored) {
      throw new NotFoundError('Encrypted off-chain payload not found in custodial repository');
    }

    // Verify cryptographic integrity against on-chain recordHash anchor
    const computedHash = sha256(stored.encryptedPayload.ciphertext);
    if (computedHash !== recordRef.recordHash) {
      throw new AppError(
        'Off-chain ciphertext integrity violation: SHA-256 hash mismatch with on-chain recordHash anchor',
        500,
        'integrity-violation'
      );
    }

    // Decrypt FHIR bundle
    const decryptedFHIR = decryptFHIRBundle(stored.encryptedPayload);

    return {
      status: 'AUTHORIZED',
      recordId,
      recordType: recordRef.recordType,
      recordHash: recordRef.recordHash,
      custodialOrg: recordRef.custodialOrg,
      fhirBundle: decryptedFHIR,
      txId: auditLogResult?.txId || uuidv4(),
      blockNumber: auditLogResult?.blockNumber || 1,
    };
  }

  /**
   * List all record references for a patient.
   */
  async getRecordsByPatient(patientRefHash) {
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    return fabricService.getRecordsByPatient(patientRefHash);
  }
}

module.exports = new RecordAccessService();
