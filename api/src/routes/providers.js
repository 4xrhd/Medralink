const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');
const { sha256 } = require('../services/hashService');
const { requireRole } = require('../middleware/roleGuard');

// POST /providers/register - Hospital Admin registers authorized provider
router.post('/register', requireRole('Admin'), async (req, res, next) => {
  try {
    const { providerId, org, role, certSerial } = req.body;
    if (!providerId || !org || !role) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'providerId, org, and role are required' }],
      });
    }

    const providerIdHash = sha256(providerId);
    const result = await fabricService.registerProvider(
      providerIdHash,
      org,
      role,
      certSerial || `CERT-SN-${Math.floor(10000 + Math.random() * 90000)}`
    );

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Provider registered on ledger',
      providerIdHash,
      org: result.provider.org,
      role: result.provider.role,
      txId: result.txId,
      blockNumber: result.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
