const fabricService = require('./fabricService');
const { sha256 } = require('./hashService');
const { BadRequestError } = require('../utils/errors');

class ProviderService {
  /**
   * Register an authorized healthcare provider on-chain.
   */
  async registerProvider({ providerId, org, role, certSerial }) {
    if (!providerId || !org || !role) {
      throw new BadRequestError('providerId, org, and role are required');
    }

    const providerIdHash = sha256(providerId);
    const existing = await fabricService.getProviderReference(providerIdHash);
    if (existing) {
      return {
        status: 'SUCCESS',
        message: 'Provider reference verified and active on ledger (Idempotent)',
        providerIdHash,
        org: existing.org || org,
        role: existing.role || role,
        txId: '0x' + providerIdHash.substring(0, 32),
        blockNumber: 1,
      };
    }

    const result = await fabricService.registerProvider(
      providerIdHash,
      org,
      role,
      certSerial || `CERT-SN-${Math.floor(10000 + Math.random() * 90000)}`
    );

    return {
      status: 'SUCCESS',
      message: 'Provider registered on ledger',
      providerIdHash,
      org: result.provider.org,
      role: result.provider.role,
      txId: result.txId,
      blockNumber: result.blockNumber,
    };
  }
}

module.exports = new ProviderService();
