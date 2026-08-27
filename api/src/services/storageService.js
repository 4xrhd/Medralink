/**
 * Custodial Off-Chain Encrypted Storage Service (Mock S3 / Encrypted Repository)
 * Manages encrypted FHIR payloads off-chain.
 */

class OffChainStorageService {
  constructor() {
    this.store = new Map();
  }

  saveRecord(recordId, recordData) {
    this.store.set(recordId, {
      recordId,
      ...recordData,
      savedAt: new Date().toISOString(),
    });
    return this.store.get(recordId);
  }

  getRecord(recordId) {
    return this.store.get(recordId) || null;
  }

  deleteRecord(recordId) {
    return this.store.delete(recordId);
  }

  listRecordsForPatient(patientRefHash) {
    const results = [];
    for (const [id, data] of this.store.entries()) {
      if (data.patientRefHash === patientRefHash) {
        results.push(data);
      }
    }
    return results;
  }

  clear() {
    this.store.clear();
  }
}

const storageInstance = new OffChainStorageService();
module.exports = storageInstance;
