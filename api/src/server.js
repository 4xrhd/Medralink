const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { authMiddleware } = require('./middleware/auth');
const { compressionMiddleware } = require('./middleware/compression');
const errorHandler = require('./middleware/errorHandler');

const patientsRouter = require('./routes/patients');
const providersRouter = require('./routes/providers');
const recordsRouter = require('./routes/records');
const consentsRouter = require('./routes/consents');
const accessRouter = require('./routes/access');
const emergencyRouter = require('./routes/emergency');
const auditRouter = require('./routes/audit');
const networkRouter = require('./routes/network');
const agentsRouter = require('./routes/agents');

const app = express();

// Security and performance hardening
app.disable('x-powered-by');
app.use(cors({ origin: '*' }));
app.use(compressionMiddleware);
app.use(express.json({ limit: '4mb' }));
app.use(authMiddleware);

// Structured Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} (${duration}ms) - User: ${req.user ? req.user.role : 'Guest'}`);
  });
  next();
});

// Mount Routes
app.use('/patients', patientsRouter);
app.use('/providers', providersRouter);
app.use('/records', recordsRouter);
app.use('/consents', consentsRouter);
app.use('/access', accessRouter);
app.use('/emergency', emergencyRouter);
app.use('/audit', auditRouter);
app.use('/agents', agentsRouter);
app.use('/', networkRouter);

// Global Error Handler (FHIR OperationOutcome)
app.use(errorHandler);

// Global Process Exception Handlers
process.on('unhandledRejection', (reason) => {
  console.error('[Process Error] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error] Uncaught Exception:', err);
});

let server = null;
if (require.main === module) {
  const demoService = require('./services/demoService');
  server = app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(` 🏥 MedraLink HL7 FHIR & Blockchain REST API Gateway`);
    console.log(` 🌐 Server listening on http://localhost:${PORT}`);
    console.log(` ⛓️  Hyperledger Fabric Channel: medralink-main`);
    console.log(` 🛡️  Privacy Mode: Zero PII on-chain (AES-256-GCM off-chain)`);
    console.log(`=======================================================`);

    // Auto-bootstrap consortium state with synthetic patients & providers
    try {
      const boot = await demoService.bootstrapDemo();
      console.log(` [Bootstrap] Initialized ${boot.patientsCount} synthetic patient records & providers on ledger.`);
    } catch (e) {
      console.warn(` [Bootstrap] Auto-bootstrap notice:`, e.message);
    }
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n[${signal}] Received shutdown signal. Closing MedraLink API server cleanly...`);
    if (server) {
      server.close(() => {
        console.log('HTTP server closed. Exiting process.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
