const express = require('express');
const router = express.Router();
const emergencyService = require('../services/emergencyService');
const { requireRole } = require('../middleware/roleGuard');

// POST /emergency/invoke - Emergency Break-Glass Invocation
router.post('/invoke', requireRole('Emergency', 'Clinician', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, reasonCode, scope, expiryMinutes } = req.body;
    const result = await emergencyService.invokeEmergencyAccess({
      patientRefHash,
      reasonCode,
      scope,
      expiryMinutes,
      user: req.user,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /emergency/review - Auditor reviews emergency event
router.post('/review', requireRole('Auditor', 'Admin'), async (req, res, next) => {
  try {
    const { emergencyId, reviewStatus, findingsNote } = req.body;
    const result = await emergencyService.reviewEmergencyAccess({
      emergencyId,
      reviewStatus,
      findingsNote,
      user: req.user,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /emergency/patient/:patientRefHash - List emergency break-glass records for a patient
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const events = await emergencyService.getEmergencyEventsByPatient(req.params.patientRefHash);
    res.json({
      patientRefHash: req.params.patientRefHash,
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
});

// GET /emergency/all - List all emergency break-glass records
router.get('/all', async (req, res, next) => {
  try {
    const events = await emergencyService.getAllEmergencyEvents();
    res.json({
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
