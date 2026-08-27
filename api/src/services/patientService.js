const fabricService = require('./fabricService');
const { verifySyntheticIdentity, getSyntheticPatientList } = require('./identityAdapter');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class PatientService {
  /**
   * Get list of predefined synthetic demo patients.
   */
  getSyntheticPatients() {
    return {
      adapter: 'MOCK_IDENTITY_ADAPTER_v1',
      warning: 'SYNTHETIC DATA | FOR DEMONSTRATION PURPOSES ONLY',
      patients: getSyntheticPatientList(),
    };
  }

  /**
   * Register a pseudonymous patient reference on-chain.
   */
  async registerPatient({ syntheticId, dob, homeOrg }) {
    const verification = verifySyntheticIdentity(syntheticId, dob);

    const existing = await fabricService.getPatientReference(verification.patientRefHash);
    if (existing) {
      return {
        status: 'SUCCESS',
        message: 'Patient reference verified and active on Hyperledger Fabric ledger (Idempotent)',
        syntheticHealthId: verification.syntheticHealthId,
        patientRefHash: verification.patientRefHash,
        homeOrg: existing.homeOrg || homeOrg || verification.homeOrg,
        txId: '0x' + verification.patientRefHash.substring(0, 32),
        blockNumber: 1,
        warning: verification.warning,
      };
    }

    const result = await fabricService.registerPatientReference(
      verification.patientRefHash,
      homeOrg || verification.homeOrg
    );

    return {
      status: 'SUCCESS',
      message: 'Patient reference registered on Hyperledger Fabric ledger',
      syntheticHealthId: verification.syntheticHealthId,
      patientRefHash: verification.patientRefHash,
      homeOrg: verification.homeOrg,
      txId: result.txId,
      blockNumber: result.blockNumber,
      warning: verification.warning,
    };
  }

  /**
   * Query patient info by salted pseudonymous hash.
   */
  async getPatient(patientRefHash) {
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    const patient = await fabricService.getPatientReference(patientRefHash);
    if (!patient) {
      throw new NotFoundError('Patient reference not found on ledger');
    }
    return patient;
  }

  async getAllPatients() {
    return fabricService.getAllPatients();
  }
}

module.exports = new PatientService();
