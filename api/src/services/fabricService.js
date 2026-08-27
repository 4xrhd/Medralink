const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sha256 } = require('./hashService');

/**
 * MedraLink Blockchain Service
 * Provides full Ledger State Management, Canonical Transactions, Block History, and Event Emission.
 */

class FabricLedgerService {
  constructor() {
    this.worldState = new Map();
    this.blocks = [];
    this.events = [];
    this.txHistory = [];
    this.currentBlockNumber = 1;
    this.channelName = 'medralink-main';
    this.chaincodeName = 'medralink-cc';

    this._initializeGenesisBlock();
  }

  _initializeGenesisBlock() {
    const genesisBlock = {
      blockNumber: 0,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      dataHash: sha256('Genesis Block: MedraLink 4-Org Consortium (Org1, Org2, Org3, OrgAuditor)'),
      timestamp: new Date().toISOString(),
      transactionCount: 0,
      channel: this.channelName,
    };
    this.blocks.push(genesisBlock);
  }

  _recordTransaction(txType, payload, actorOrg = 'Org1MSP') {
    const txId = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    const prevBlock = this.blocks[this.blocks.length - 1];

    const txRecord = {
      txId,
      txType,
      channel: this.channelName,
      chaincode: this.chaincodeName,
      endorsingOrgs: [actorOrg, 'Org3MSP'],
      timestamp,
      payload,
      status: 'VALID',
      blockNumber: this.currentBlockNumber,
    };

    this.txHistory.push(txRecord);

    const block = {
      blockNumber: this.currentBlockNumber++,
      previousHash: prevBlock.dataHash,
      dataHash: sha256(JSON.stringify(txRecord)),
      timestamp,
      transactionCount: 1,
      transactions: [txRecord],
      channel: this.channelName,
    };

    this.blocks.push(block);
    return txRecord;
  }

  _emitEvent(eventName, payload) {
    const event = {
      eventName,
      chaincode: this.chaincodeName,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  // =========================================================================
  // Transaction 1: RegisterPatientReference
  // =========================================================================
  async registerPatientReference(patientRefHash, homeOrg = 'Org1MSP') {
    if (!patientRefHash) throw new Error('patientRefHash is required');
    if (this.worldState.has(patientRefHash)) {
      throw new Error(`Patient reference '${patientRefHash}' already registered on ledger`);
    }

    const patient = {
      docType: 'PatientReference',
      patientRefHash,
      homeOrg,
      createdAt: new Date().toISOString(),
      active: true,
    };

    this.worldState.set(patientRefHash, patient);
    const tx = this._recordTransaction('RegisterPatientReference', patient, homeOrg);
    this._emitEvent('PatientRegistered', patient);

    return { patient, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 2: RegisterProvider
  // =========================================================================
  async registerProvider(providerIdHash, org, role, certSerial = 'CERT-SN-88219') {
    if (!providerIdHash || !org || !role) throw new Error('Missing provider registration parameters');

    const key = `PROV_${providerIdHash}`;
    if (this.worldState.has(key)) {
      throw new Error(`Provider '${providerIdHash}' already registered`);
    }

    const provider = {
      docType: 'ProviderReference',
      providerIdHash,
      org,
      role,
      certSerial,
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.worldState.set(key, provider);
    const tx = this._recordTransaction('RegisterProvider', provider, org);
    this._emitEvent('ProviderRegistered', provider);

    return { provider, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 3: CreateRecordReference
  // =========================================================================
  async createRecordReference(recordId, patientRefHash, recordType, recordHash, opaquePointerHash, custodialOrg = 'Org1MSP', provenance = 'PROV_DOCTOR_A') {
    if (!recordId || !patientRefHash || !recordType || !recordHash || !opaquePointerHash) {
      throw new Error('Missing required record reference parameters');
    }

    if (!this.worldState.has(patientRefHash)) {
      throw new Error(`Patient reference '${patientRefHash}' does not exist on blockchain`);
    }

    const key = `REC_${recordId}`;
    if (this.worldState.has(key)) {
      throw new Error(`Record ID '${recordId}' already exists`);
    }

    const record = {
      docType: 'RecordReference',
      recordId,
      patientRefHash,
      recordType,
      recordHash,
      opaquePointerHash,
      custodialOrg,
      provenance,
      createdAt: new Date().toISOString(),
    };

    this.worldState.set(key, record);
    const tx = this._recordTransaction('CreateRecordReference', record, custodialOrg);
    this._emitEvent('RecordCreated', record);

    return { record, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 4: GrantConsent
  // =========================================================================
  async grantConsent(consentId, patientRefHash, grantee, scope, purpose, expiryTimestamp, patientSig = 'ECDSA_SIG_OK') {
    if (!consentId || !patientRefHash || !grantee || !scope || !purpose || !expiryTimestamp) {
      throw new Error('Missing required consent fields');
    }

    const key = `CONSENT_${consentId}`;
    if (this.worldState.has(key)) {
      throw new Error(`Consent ID '${consentId}' already exists`);
    }

    const scopes = Array.isArray(scope) ? scope : [scope];

    // Data minimization check: no wildcards
    if (scopes.includes('*')) {
      throw new Error("Wildcard scope '*' is prohibited under PDPO 2025 data minimization principles");
    }

    const consent = {
      docType: 'Consent',
      consentId,
      patientRefHash,
      grantee,
      scope: scopes,
      purpose,
      expiryTimestamp,
      revoked: false,
      patientSig,
      createdAt: new Date().toISOString(),
    };

    this.worldState.set(key, consent);
    const tx = this._recordTransaction('GrantConsent', consent, 'Org1MSP');
    this._emitEvent('ConsentGranted', consent);

    return { consent, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 5: RevokeConsent
  // =========================================================================
  async revokeConsent(consentId, patientRefHash) {
    const key = `CONSENT_${consentId}`;
    const consent = this.worldState.get(key);
    if (!consent) {
      throw new Error(`Consent ID '${consentId}' not found on ledger`);
    }
    if (consent.patientRefHash !== patientRefHash) {
      throw new Error('Unauthorized: Patient reference mismatch');
    }
    if (consent.revoked) {
      throw new Error(`Consent '${consentId}' is already revoked`);
    }

    consent.revoked = true;
    consent.revokedAt = new Date().toISOString();
    this.worldState.set(key, consent);

    const tx = this._recordTransaction('RevokeConsent', { consentId, patientRefHash, revoked: true }, 'Org1MSP');
    this._emitEvent('ConsentRevoked', { consentId, patientRefHash });

    return { consent, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 6: RequestAccess
  // =========================================================================
  async requestAccess(requestId, patientRefHash, consentId, accessorHash, scope, purpose) {
    const key = `CONSENT_${consentId}`;
    const consent = this.worldState.get(key);

    if (!consent) {
      return { allowed: false, status: 'DENIED', reason: `Consent '${consentId}' not found` };
    }
    if (consent.patientRefHash !== patientRefHash) {
      return { allowed: false, status: 'DENIED', reason: 'Patient reference mismatch' };
    }
    if (consent.revoked) {
      return { allowed: false, status: 'CONSENT_REVOKED', reason: 'Consent was revoked by patient' };
    }

    const now = new Date();
    const expiry = new Date(consent.expiryTimestamp);
    if (now > expiry) {
      return { allowed: false, status: 'EXPIRED', reason: 'Consent authorization has expired' };
    }

    if (scope && !consent.scope.includes(scope)) {
      return { allowed: false, status: 'DENIED', reason: `Scope '${scope}' not covered in consent token` };
    }

    if (purpose && consent.purpose !== purpose) {
      return { allowed: false, status: 'DENIED', reason: `Purpose '${purpose}' mismatches consented purpose '${consent.purpose}'` };
    }

    const accessResult = {
      allowed: true,
      status: 'GRANTED',
      reason: 'Valid active consent grant verified on-chain',
      consentId,
    };

    const tx = this._recordTransaction('RequestAccess', { requestId, patientRefHash, accessorHash, status: 'GRANTED' }, 'Org1MSP');
    this._emitEvent('AccessRequested', { requestId, patientRefHash, status: 'GRANTED' });

    return { ...accessResult, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 7: LogAccess
  // =========================================================================
  async logAccess(requestId, patientRefHash, accessorHash, scope, purpose, status) {
    const auditEvent = {
      docType: 'AccessEvent',
      requestId: requestId || uuidv4(),
      patientRefHash,
      accessorHash,
      scope,
      purpose,
      timestamp: new Date().toISOString(),
      status,
    };

    const key = `AUDIT_${auditEvent.requestId}`;
    this.worldState.set(key, auditEvent);

    const tx = this._recordTransaction('LogAccess', auditEvent, 'Org1MSP');
    this._emitEvent('AccessLogged', auditEvent);

    return { auditEvent, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 8: InvokeEmergencyAccess
  // =========================================================================
  async invokeEmergencyAccess(emergencyId, clinicianIdHash, patientRefHash, reasonCode, scope, expiryTimestamp) {
    if (!emergencyId || !clinicianIdHash || !patientRefHash || !reasonCode || !scope) {
      throw new Error('Missing emergency break-glass parameters');
    }

    const key = `EMERGENCY_${emergencyId}`;
    if (this.worldState.has(key)) {
      throw new Error(`Emergency event '${emergencyId}' already exists`);
    }

    const emergencyEvent = {
      docType: 'EmergencyAccessEvent',
      emergencyId,
      patientRefHash,
      clinicianIdHash,
      reasonCode,
      scope: Array.isArray(scope) ? scope : [scope],
      expiryTimestamp: expiryTimestamp || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      reviewStatus: 'PENDING',
      reviewerHash: '',
      findingsHash: '',
      createdAt: new Date().toISOString(),
      reviewedAt: '',
    };

    this.worldState.set(key, emergencyEvent);
    const tx = this._recordTransaction('InvokeEmergencyAccess', emergencyEvent, 'Org2MSP');
    this._emitEvent('EmergencyAccessInvoked', emergencyEvent);

    // Auto-log into immutable audit log
    await this.logAccess(
      `EMG_${emergencyId}`,
      patientRefHash,
      clinicianIdHash,
      `EMERGENCY_BREAKGLASS(${reasonCode})`,
      'emergency',
      'GRANTED_BREAKGLASS'
    );

    return { emergencyEvent, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Transaction 9: ReviewEmergencyAccess
  // =========================================================================
  async reviewEmergencyAccess(emergencyId, auditorIdHash, reviewStatus, findingsHash = '') {
    const key = `EMERGENCY_${emergencyId}`;
    const event = this.worldState.get(key);
    if (!event) {
      throw new Error(`Emergency event '${emergencyId}' not found`);
    }

    event.reviewStatus = reviewStatus;
    event.reviewerHash = auditorIdHash;
    event.findingsHash = findingsHash || sha256(`Audit finding for emergency ${emergencyId}: ${reviewStatus}`);
    event.reviewedAt = new Date().toISOString();

    this.worldState.set(key, event);
    const tx = this._recordTransaction('ReviewEmergencyAccess', event, 'OrgAuditorMSP');
    this._emitEvent('EmergencyAccessReviewed', event);

    return { emergencyEvent: event, txId: tx.txId, blockNumber: tx.blockNumber };
  }

  // =========================================================================
  // Query Methods
  // =========================================================================
  async getPatientReference(patientRefHash) {
    return this.worldState.get(patientRefHash) || null;
  }

  async getRecordReference(recordId) {
    return this.worldState.get(`REC_${recordId}`) || null;
  }

  async getRecordsByPatient(patientRefHash) {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith('REC_') && value.patientRefHash === patientRefHash) {
        results.push(value);
      }
    }
    return results;
  }

  async getConsentsByPatient(patientRefHash) {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith('CONSENT_') && value.patientRefHash === patientRefHash) {
        results.push(value);
      }
    }
    return results;
  }

  async getAuditHistory(patientRefHash) {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith('AUDIT_') && value.patientRefHash === patientRefHash) {
        results.push(value);
      }
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getAllEmergencyEvents() {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith('EMERGENCY_')) {
        results.push(value);
      }
    }
    return results;
  }

  async getEmergencyEventsByPatient(patientRefHash) {
    const results = [];
    for (const [key, value] of this.worldState.entries()) {
      if (key.startsWith('EMERGENCY_') && value.patientRefHash === patientRefHash) {
        results.push(value);
      }
    }
    return results;
  }

  async getBlocks() {
    return this.blocks;
  }

  async getNetworkStatus() {
    return {
      status: 'ONLINE',
      channel: this.channelName,
      chaincode: this.chaincodeName,
      blockHeight: this.blocks.length,
      totalTransactions: this.txHistory.length,
      organizations: [
        { mspId: 'Org1MSP', name: 'Hospital A (Pilot)', role: 'Endorsing Peer + Raft Consenter', status: 'ACTIVE' },
        { mspId: 'Org2MSP', name: 'Hospital B / Lab', role: 'Endorsing Peer + Raft Consenter', status: 'ACTIVE' },
        { mspId: 'Org3MSP', name: 'Medralink Operator', role: 'Gateway + Raft Consenter', status: 'ACTIVE' },
        { mspId: 'OrgAuditorMSP', name: 'DGHS / Auditor', role: 'Read-only Audit Replica', status: 'ACTIVE' },
      ],
      consensus: 'CFT Raft (3 Nodes)',
      dataPrivacy: 'Off-Chain Encrypted (Zero PII On-Chain)',
    };
  }
}

const fabricLedgerInstance = new FabricLedgerService();
module.exports = fabricLedgerInstance;
