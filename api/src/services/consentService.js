const { v4: uuidv4 } = require('uuid');
const fabricService = require('./fabricService');
const { BadRequestError } = require('../utils/errors');

class ConsentService {
  /**
   * Grant a granular, purpose-bound, time-boxed consent token on-chain.
   */
  async grantConsent({ patientRefHash, grantee, scope, purpose, expiryDays }) {
    if (!patientRefHash || !grantee || !scope) {
      throw new BadRequestError('patientRefHash, grantee, and scope are required');
    }

    const consentId = uuidv4();
    const days = parseInt(expiryDays, 10) || 7;
    const expiryTimestamp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const result = await fabricService.grantConsent(
      consentId,
      patientRefHash,
      grantee,
      scope,
      purpose || 'treatment',
      expiryTimestamp,
      'ECDSA_PATIENT_APP_SIG'
    );

    return {
      status: 'SUCCESS',
      message: 'Granular consent token recorded on blockchain',
      consentId,
      patientRefHash,
      grantee,
      scope: result.consent.scope,
      purpose: result.consent.purpose,
      expiryTimestamp,
      txId: result.txId,
      blockNumber: result.blockNumber,
    };
  }

  /**
   * Revoke an active consent token immediately.
   */
  async revokeConsent(consentId, patientRefHash) {
    if (!patientRefHash) {
      const consent = fabricService.worldState?.get(`CONSENT_${consentId}`);
      if (consent && consent.patientRefHash) {
        patientRefHash = consent.patientRefHash;
      } else {
        throw new BadRequestError('patientRefHash is required in body or consent must exist');
      }
    }

    const result = await fabricService.revokeConsent(consentId, patientRefHash);

    return {
      status: 'SUCCESS',
      message: 'Consent token revoked on blockchain',
      consentId,
      patientRefHash,
      revoked: true,
      txId: result.txId,
      blockNumber: result.blockNumber,
    };
  }

  /**
   * Query all consent records for a patient.
   */
  async getConsentsByPatient(patientRefHash) {
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    return fabricService.getConsentsByPatient(patientRefHash);
  }

  /**
   * Request and verify access authorization for a clinical purpose.
   */
  async verifyAccessRequest({ patientRefHash, consentId, requesterId, scope, purpose }) {
    if (!patientRefHash || !consentId) {
      throw new BadRequestError('patientRefHash and consentId are required');
    }

    const requestId = uuidv4();
    const result = await fabricService.requestAccess(
      requestId,
      patientRefHash,
      consentId,
      requesterId || 'clinician_user',
      scope,
      purpose || 'treatment'
    );

    // Record immutable audit entry on ledger
    await fabricService.logAccess(
      requestId,
      patientRefHash,
      requesterId || 'clinician_user',
      scope || 'GENERAL',
      purpose || 'treatment',
      result.status
    );

    if (!result.allowed) {
      const { ForbiddenError } = require('../utils/errors');
      throw new ForbiddenError(
        `Access denied: ${result.reason} [Status: ${result.status}]`,
        result.status
      );
    }

    return {
      status: 'GRANTED',
      reason: result.reason,
      verificationStatus: result.status,
      requestId,
      consentId,
      txId: result.txId,
      blockNumber: result.blockNumber,
    };
  }
}

module.exports = new ConsentService();
