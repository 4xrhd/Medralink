const express = require('express');
const router = express.Router();
const recordAccessService = require('../services/recordAccessService');
const { requireRole } = require('../middleware/roleGuard');

// POST /records - Create encrypted FHIR record and anchor hash on blockchain
router.post('/', requireRole('Clinician', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, recordType, clinicalData, custodialOrg } = req.body;
    const result = await recordAccessService.createEncryptedRecord({
      patientRefHash,
      recordType,
      clinicalData,
      custodialOrg,
      user: req.user,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /records/:id - Retrieve and decrypt clinical record (Requires valid consent check)
router.get('/:id', requireRole('Clinician', 'Emergency', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { consentId, emergencyId, purpose } = req.query;

    const result = await recordAccessService.getDecryptedRecord({
      recordId: id,
      user: req.user,
      consentId,
      emergencyId,
      purpose,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /records/patient/:patientRefHash - List all record references for a patient
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const { patientRefHash } = req.params;
    const records = await recordAccessService.getRecordsByPatient(patientRefHash);
    res.json({
      patientRefHash,
      count: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
