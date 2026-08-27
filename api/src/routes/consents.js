const express = require('express');
const router = express.Router();
const consentService = require('../services/consentService');
const { requireRole } = require('../middleware/roleGuard');

// POST /consents - Grant consent
router.post('/', requireRole('Patient', 'Admin', 'Clinician'), async (req, res, next) => {
  try {
    const { patientRefHash, grantee, scope, purpose, expiryDays } = req.body;
    const result = await consentService.grantConsent({
      patientRefHash,
      grantee,
      scope,
      purpose,
      expiryDays,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /consents/:id - Revoke consent
router.delete('/:id', requireRole('Patient', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientRefHash } = req.body;
    const result = await consentService.revokeConsent(id, patientRefHash);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /consents/patient/:patientRefHash - List patient consents
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const consents = await consentService.getConsentsByPatient(req.params.patientRefHash);
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
