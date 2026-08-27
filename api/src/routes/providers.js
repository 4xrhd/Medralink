const express = require('express');
const router = express.Router();
const providerService = require('../services/providerService');
const { requireRole } = require('../middleware/roleGuard');

// POST /providers/register - Hospital Admin registers authorized provider
router.post('/register', requireRole('Admin'), async (req, res, next) => {
  try {
    const { providerId, org, role, certSerial } = req.body;
    const result = await providerService.registerProvider({
      providerId,
      org,
      role,
      certSerial,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /providers or GET /providers/all - List registered authorized providers on ledger
router.get('/', async (req, res, next) => {
  try {
    const providers = await providerService.getAllProviders();
    res.json(providers);
  } catch (err) {
    next(err);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const providers = await providerService.getAllProviders();
    res.json(providers);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
