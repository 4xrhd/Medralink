/**
 * Custodial Off-Chain Encrypted Storage Service (Mock S3 / Encrypted Repository)
 * Manages encrypted FHIR payloads off-chain.
 */

class OffChainStorageService {
  constructor() {
    this.store = new Map();
    this.patientRecordsIndex = new Map(); // patientRefHash -> Set<recordId>
  }

  saveRecord(recordId, recordData) {
    const entry = {
      recordId,
      ...recordData,
      savedAt: new Date().toISOString(),
    };
    this.store.set(recordId, entry);

    if (recordData.patientRefHash) {
      if (!this.patientRecordsIndex.has(recordData.patientRefHash)) {
        this.patientRecordsIndex.set(recordData.patientRefHash, new Set());
      }
      this.patientRecordsIndex.get(recordData.patientRefHash).add(recordId);
    }
    return entry;
  }

  getRecord(recordId) {
    return this.store.get(recordId) || null;
  }

  deleteRecord(recordId) {
    const record = this.store.get(recordId);
    if (record && record.patientRefHash) {
      const pSet = this.patientRecordsIndex.get(record.patientRefHash);
      if (pSet) {
        pSet.delete(recordId);
        if (pSet.size === 0) this.patientRecordsIndex.delete(record.patientRefHash);
      }
    }
    return this.store.delete(recordId);
  }

  listRecordsForPatient(patientRefHash) {
    const recordIds = this.patientRecordsIndex.get(patientRefHash);
    if (!recordIds || recordIds.size === 0) return [];
    const results = [];
    for (const id of recordIds) {
      const record = this.store.get(id);
      if (record) results.push(record);
    }
    return results;
  }

  clear() {
    this.store.clear();
    this.patientRecordsIndex.clear();
  }
}

const storageInstance = new OffChainStorageService();
module.exports = storageInstance;
