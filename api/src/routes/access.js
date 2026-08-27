const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fabricService = require('../services/fabricService');
const { requireRole } = require('../middleware/roleGuard');

// POST /access/request - Request and verify access authorization
router.post('/request', requireRole('Clinician', 'Emergency', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, consentId, scope, purpose } = req.body;
    if (!patientRefHash || !consentId) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'patientRefHash and consentId are required' }],
      });
    }

    const requestId = uuidv4();
    const result = await fabricService.requestAccess(
      requestId,
      patientRefHash,
      consentId,
      req.user.id || 'clinician_user',
      scope,
      purpose || 'treatment'
    );

    // Record immutable audit entry on ledger
    await fabricService.logAccess(
      requestId,
      patientRefHash,
      req.user.id || 'clinician_user',
      scope || 'GENERAL',
      purpose || 'treatment',
      result.status
    );

    if (!result.allowed) {
      return res.status(403).json({
        status: 'DENIED',
        reason: result.reason,
        verificationStatus: result.status,
        txId: result.txId,
        blockNumber: result.blockNumber,
      });
    }

    res.json({
      status: 'GRANTED',
      reason: result.reason,
      verificationStatus: result.status,
      requestId,
      consentId,
      txId: result.txId,
      blockNumber: result.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
