const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');
const { requireRole } = require('../middleware/roleGuard');

// GET /patients/synthetic - List available synthetic demo patients
router.get('/synthetic', (req, res) => {
  const result = patientService.getSyntheticPatients();
  res.json(result);
});

// POST /patients/register - Register patient on-chain via mock identity adapter
router.post('/register', requireRole('Admin', 'Clinician', 'Patient'), async (req, res, next) => {
  try {
    const { syntheticId, dob, homeOrg } = req.body;
    const result = await patientService.registerPatient({ syntheticId, dob, homeOrg });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /patients/:patientRefHash - Query patient info on ledger
router.get('/:patientRefHash', async (req, res, next) => {
  try {
    const patient = await patientService.getPatient(req.params.patientRefHash);
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
