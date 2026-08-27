const { v4: uuidv4 } = require('uuid');
const fabricService = require('./fabricService');
const { sha256 } = require('./hashService');
const { BadRequestError } = require('../utils/errors');

class EmergencyService {
  /**
   * Invoke emergency break-glass access under life-safety protocols.
   */
  async invokeEmergencyAccess({ patientRefHash, reasonCode, scope, expiryMinutes, user }) {
    if (!patientRefHash || !reasonCode || !scope) {
      throw new BadRequestError('patientRefHash, reasonCode, and scope are required');
    }

    const emergencyId = uuidv4();
    const minutes = parseInt(expiryMinutes, 10) || 60;
    const expiryTimestamp = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const clinicianIdHash = sha256(user?.id || 'emergency_clinician');

    const result = await fabricService.invokeEmergencyAccess(
      emergencyId,
      clinicianIdHash,
      patientRefHash,
      reasonCode,
      scope,
      expiryTimestamp
    );

    return {
      status: 'GRANTED_EMERGENCY',
      message: 'Emergency break-glass access invoked and time-boxed grant issued',
      emergencyId,
      patientRefHash,
      reasonCode,
      scope: result.emergencyEvent.scope,
      expiryTimestamp,
      reviewStatus: 'PENDING',
      txId: result.txId,
      blockNumber: result.blockNumber,
      warning: 'MANDATORY POST-HOC AUDITOR REVIEW REQUIRED',
    };
  }

  /**
   * Post-hoc DGHS auditor review of an emergency break-glass invocation.
   */
  async reviewEmergencyAccess({ emergencyId, reviewStatus, findingsNote, user }) {
    if (!emergencyId || !reviewStatus) {
      throw new BadRequestError('emergencyId and reviewStatus (APPROPRIATE/INAPPROPRIATE) are required');
    }

    const auditorIdHash = sha256(user?.id || 'auditor_user');
    const findingsHash = sha256(findingsNote || `Audit finding: ${reviewStatus}`);

    const result = await fabricService.reviewEmergencyAccess(
      emergencyId,
      auditorIdHash,
      reviewStatus,
      findingsHash
    );

    return {
      status: 'SUCCESS',
      message: `Emergency break-glass access reviewed and marked ${reviewStatus}`,
      emergencyId,
      reviewStatus,
      reviewerHash: auditorIdHash,
      findingsHash,
      reviewedAt: result.emergencyEvent.reviewedAt,
      txId: result.txId,
      blockNumber: result.blockNumber,
    };
  }

  /**
   * List emergency events for a patient.
   */
  async getEmergencyEventsByPatient(patientRefHash) {
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    return fabricService.getEmergencyEventsByPatient(patientRefHash);
  }

  /**
   * List all consortium emergency events.
   */
  async getAllEmergencyEvents() {
    return fabricService.getAllEmergencyEvents();
  }
}

module.exports = new EmergencyService();
