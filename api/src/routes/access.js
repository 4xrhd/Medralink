const express = require('express');
const router = express.Router();
const consentService = require('../services/consentService');
const { requireRole } = require('../middleware/roleGuard');

// POST /access/request - Request and verify access authorization
router.post('/request', requireRole('Clinician', 'Emergency', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, consentId, scope, purpose } = req.body;
    const result = await consentService.verifyAccessRequest({
      patientRefHash,
      consentId,
      requesterId: req.user?.id,
      scope,
      purpose,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
