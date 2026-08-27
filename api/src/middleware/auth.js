const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const DEMO_USERS = {
  patient: {
    id: 'patient_01',
    role: 'Patient',
    name: 'Rahim Chowdhury (Synthetic)',
    mspId: 'Org1MSP',
    syntheticId: 'BD-HEALTH-994821',
    dob: '1992-05-14',
  },
  clinician: {
    id: 'clinician_dr_hasan',
    role: 'Clinician',
    name: 'Dr. Hasan Mahmud',
    hospital: 'Hospital A (Pilot)',
    mspId: 'Org1MSP',
    ou: 'Clinician',
  },
  emergency: {
    id: 'emergency_dr_alam',
    role: 'Emergency',
    name: 'Dr. Nusrat Alam (ED Registrar)',
    hospital: 'Hospital B (Emergency Dept)',
    mspId: 'Org2MSP',
    ou: 'Emergency',
  },
  auditor: {
    id: 'auditor_dghs_01',
    role: 'Auditor',
    name: 'DGHS Compliance Inspector',
    organization: 'Directorate General of Health Services (DGHS)',
    mspId: 'OrgAuditorMSP',
    ou: 'Auditor',
  },
  admin: {
    id: 'admin_hospital_a',
    role: 'Admin',
    name: 'Hospital A System Admin',
    mspId: 'Org1MSP',
    ou: 'Admin',
  },
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const demoRoleHeader = req.headers['x-demo-role'];

  if (demoRoleHeader && DEMO_USERS[demoRoleHeader.toLowerCase()]) {
    req.user = DEMO_USERS[demoRoleHeader.toLowerCase()];
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'login', diagnostics: 'Invalid or expired JWT token' }],
      });
    }
  }

  // Default to guest or demo patient for easy testing
  req.user = DEMO_USERS.clinician;
  next();
}

module.exports = {
  authMiddleware,
  DEMO_USERS,
};
