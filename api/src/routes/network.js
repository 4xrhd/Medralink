const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabricService');
const demoService = require('../services/demoService');

// GET /health - Public health check
router.get('/health', async (req, res) => {
  const status = await fabricService.getNetworkStatus();
  res.json({
    status: 'HEALTHY',
    service: 'MedraLink API Gateway',
    version: '1.0.0-prototype',
    channel: status.channel,
    chaincode: status.chaincode,
    blockHeight: status.blockHeight,
    timestamp: new Date().toISOString(),
  });
});

// GET /network/status - Detailed consortium status
router.get('/status', async (req, res) => {
  const status = await fabricService.getNetworkStatus();
  res.json(status);
});

// GET /events - Real-time Server-Sent Events (SSE) stream for blockchain blocks & transactions
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', channel: 'medralink-main', timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat every 20s to prevent proxy/NAT timeout
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 20000);

  const onBlock = (block) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'BLOCK', block })}\n\n`);
    } catch {
      // Stream closed
    }
  };

  const onTx = (tx) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'TRANSACTION', tx })}\n\n`);
    } catch {
      // Stream closed
    }
  };

  const onChaincodeEvent = (event) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'CHAINCODE_EVENT', event })}\n\n`);
    } catch {
      // Stream closed
    }
  };

  fabricService.on('block', onBlock);
  fabricService.on('transaction', onTx);
  fabricService.on('chaincodeEvent', onChaincodeEvent);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    fabricService.off('block', onBlock);
    fabricService.off('transaction', onTx);
    fabricService.off('chaincodeEvent', onChaincodeEvent);
  });
});

// POST /demo/bootstrap - One-click automated setup for demo
router.post('/demo/bootstrap', async (req, res, next) => {
  try {
    const result = await demoService.bootstrapDemo();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
