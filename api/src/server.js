const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { authMiddleware } = require('./middleware/auth');
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

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(authMiddleware);

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.user ? req.user.role : 'Guest'}`);
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` 🏥 MedraLink HL7 FHIR & Blockchain REST API Gateway`);
    console.log(` 🌐 Server listening on http://localhost:${PORT}`);
    console.log(` ⛓️  Hyperledger Fabric Channel: medralink-main`);
    console.log(` 🛡️  Privacy Mode: Zero PII on-chain (AES-256-GCM off-chain)`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
