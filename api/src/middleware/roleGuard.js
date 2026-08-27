function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'forbidden', diagnostics: 'Authentication required' }],
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'forbidden',
            diagnostics: `Role '${req.user.role}' is not authorized to perform this operation. Allowed: [${allowedRoles.join(', ')}]`,
          },
        ],
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
};
