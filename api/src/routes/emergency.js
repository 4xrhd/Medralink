const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fabricService = require('../services/fabricService');
const { sha256 } = require('../services/hashService');
const { requireRole } = require('../middleware/roleGuard');

// POST /emergency/invoke - Emergency Break-Glass Invocation
router.post('/invoke', requireRole('Emergency', 'Clinician', 'Admin'), async (req, res, next) => {
  try {
    const { patientRefHash, reasonCode, scope, expiryMinutes } = req.body;
    if (!patientRefHash || !reasonCode || !scope) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'patientRefHash, reasonCode, and scope are required' }],
      });
    }

    const emergencyId = uuidv4();
    const minutes = parseInt(expiryMinutes, 10) || 60;
    const expiryTimestamp = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const clinicianIdHash = sha256(req.user.id || 'emergency_clinician');

    const result = await fabricService.invokeEmergencyAccess(
      emergencyId,
      clinicianIdHash,
      patientRefHash,
      reasonCode,
      scope,
      expiryTimestamp
    );

    res.status(201).json({
      status: 'GRANTED_EMERGENCY',
      message: 'Emergency break-glass access invoked and time-boxed grant issued',
      emergencyId,
      patientRefHash,
      reasonCode,
      scope: result.emergencyEvent.scope,
      expiryTimestamp,
      reviewStatus: 'PENDING',
      txId: result.txId,
      blockNumber: result.blockNumber,
      warning: 'MANDATORY POST-HOC AUDITOR REVIEW REQUIRED',
    });
  } catch (err) {
    next(err);
  }
});

// POST /emergency/review - Auditor reviews emergency event
router.post('/review', requireRole('Auditor', 'Admin'), async (req, res, next) => {
  try {
    const { emergencyId, reviewStatus, findingsNote } = req.body;
    if (!emergencyId || !reviewStatus) {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'required', diagnostics: 'emergencyId and reviewStatus (APPROPRIATE/INAPPROPRIATE) are required' }],
      });
    }

    const auditorIdHash = sha256(req.user.id || 'auditor_user');
    const findingsHash = sha256(findingsNote || `Audit finding: ${reviewStatus}`);

    const result = await fabricService.reviewEmergencyAccess(
      emergencyId,
      auditorIdHash,
      reviewStatus,
      findingsHash
    );

    res.json({
      status: 'SUCCESS',
      message: `Emergency break-glass access reviewed and marked ${reviewStatus}`,
      emergencyId,
      reviewStatus,
      reviewerHash: auditorIdHash,
      findingsHash,
      reviewedAt: result.emergencyEvent.reviewedAt,
      txId: result.txId,
      blockNumber: result.blockNumber,
    });
  } catch (err) {
    next(err);
  }
});

// GET /emergency/patient/:patientRefHash - List emergency break-glass records for a patient
router.get('/patient/:patientRefHash', async (req, res, next) => {
  try {
    const events = await fabricService.getEmergencyEventsByPatient(req.params.patientRefHash);
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
    const events = await fabricService.getAllEmergencyEvents();
    res.json({
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
