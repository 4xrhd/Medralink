const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');

// GET /audit/:patientRefHash - Get immutable access audit history for patient
router.get('/:patientRefHash', async (req, res, next) => {
  try {
    const { patientRefHash } = req.params;
    const history = await fabricService.getAuditHistory(patientRefHash);

    res.json({
      patientRefHash,
      eventCount: history.length,
      auditTrail: history,
    });
  } catch (err) {
    next(err);
  }
});

// GET /audit/blocks/all - Query block history
router.get('/blocks/all', async (req, res, next) => {
  try {
    const blocks = await fabricService.getBlocks();
    res.json({
      blockHeight: blocks.length,
      blocks,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
