const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fabricService = require('../services/fabricService');
const { requireRole } = require('../middleware/roleGuard');
const { BadRequestError } = require('../utils/errors');

// POST /consents - Grant consent
router.post('/', requireRole('Patient', 'Admin', 'Clinician'), async (req, res, next) => {
  try {
    const { patientRefHash, grantee, scope, purpose, expiryDays } = req.body;
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

    res.status(201).json({
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
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /consents/:id - Revoke consent
router.delete('/:id', requireRole('Patient', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientRefHash } = req.body;

    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required in body');
    }

    const result = await fabricService.revokeConsent(id, patientRefHash);

    res.json({
      status: 'SUCCESS',
      message: 'Consent token revoked on blockchain',
      consentId: id,
      patientRefHash,
      revoked: true,
      txId: result.txId,
      blockNumber: result.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// GET /consents/patient/:patientRefHash - List patient consents
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const consents = await fabricService.getConsentsByPatient(req.params.patientRefHash);
    res.json({
      patientRefHash: req.params.patientRefHash,
      count: consents.length,
      consents,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
