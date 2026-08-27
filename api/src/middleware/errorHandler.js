function errorHandler(err, req, res, next) {
  console.error('[MedraLink Error]:', err.message);

  const status = err.status || 500;
  res.status(status).json({
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'error',
        code: err.code || 'processing',
        diagnostics: err.message || 'Internal processing error',
      },
    ],
  });
}

module.exports = errorHandler;
