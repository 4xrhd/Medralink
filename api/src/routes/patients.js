const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');
const { verifySyntheticIdentity, getSyntheticPatientList } = require('../services/identityAdapter');
const { requireRole } = require('../middleware/roleGuard');
const { NotFoundError } = require('../utils/errors');

// GET /patients/synthetic - List available synthetic demo patients
router.get('/synthetic', (req, res) => {
  const patients = getSyntheticPatientList();
  res.json({
    adapter: 'MOCK_IDENTITY_ADAPTER_v1',
    warning: 'SYNTHETIC DATA — FOR DEMONSTRATION PURPOSES ONLY',
    patients,
  });
});

// POST /patients/register - Register patient on-chain via mock identity adapter
router.post('/register', requireRole('Admin', 'Clinician', 'Patient'), async (req, res, next) => {
  try {
    const { syntheticId, dob, homeOrg } = req.body;
    const verification = verifySyntheticIdentity(syntheticId, dob);

    const result = await fabricService.registerPatientReference(
      verification.patientRefHash,
      homeOrg || verification.homeOrg
    );

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Patient reference registered on Hyperledger Fabric ledger',
      syntheticHealthId: verification.syntheticHealthId,
      patientRefHash: verification.patientRefHash,
      homeOrg: verification.homeOrg,
      txId: result.txId,
      blockNumber: result.blockNumber,
      warning: verification.warning,
    });
  } catch (err) {
    next(err);
  }
});

// GET /patients/:patientRefHash - Query patient info on ledger
router.get('/:patientRefHash', async (req, res, next) => {
  try {
    const patient = await fabricService.getPatientReference(req.params.patientRefHash);
    if (!patient) {
      throw new NotFoundError('Patient reference not found on ledger');
    }
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
