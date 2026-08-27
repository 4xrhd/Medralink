const { generatePatientRefHash, sha256 } = require('./hashService');

/**
 * Mock Identity Verification Adapter (Simulating Bangladesh NID / Porichoy Gateway)
 * Notice: This adapter strictly generates synthetic mock identities for competition testing.
 * No real NIDs are accepted or processed.
 */

const PREDEFINED_SYNTHETIC_PATIENTS = [
  {
    syntheticId: 'BD-HEALTH-994821',
    dob: '1992-05-14',
    name: 'Rahim Chowdhury (Synthetic)',
    gender: 'male',
    bloodGroup: 'B+',
    homeOrg: 'Org1MSP',
  },
  {
    syntheticId: 'BD-HEALTH-771204',
    dob: '1988-11-23',
    name: 'Fatema Begum (Synthetic)',
    gender: 'female',
    bloodGroup: 'O+',
    homeOrg: 'Org2MSP',
  },
  {
    syntheticId: 'BD-HEALTH-451992',
    dob: '2001-02-09',
    name: 'Tanvir Hasan (Synthetic)',
    gender: 'male',
    bloodGroup: 'A+',
    homeOrg: 'Org1MSP',
  },
];

/**
 * Verifies synthetic patient identity and returns pseudonymous patient reference
 */
function verifySyntheticIdentity(syntheticId, dob) {
  const match = PREDEFINED_SYNTHETIC_PATIENTS.find(
    (p) => p.syntheticId === syntheticId || p.dob === dob
  );

  const target = match || {
    syntheticId: syntheticId || `BD-HEALTH-${Math.floor(100000 + Math.random() * 900000)}`,
    dob: dob || '1990-01-01',
    homeOrg: 'Org1MSP',
  };

  const patientRefHash = generatePatientRefHash(target.syntheticId, target.dob);

  return {
    verified: true,
    adapterMode: 'MOCK_IDENTITY_ADAPTER_v1',
    syntheticHealthId: target.syntheticId,
    patientRefHash,
    homeOrg: target.homeOrg,
    warning: 'SYNTHETIC DATA — NO REAL NID STORED OR PROCESSED',
  };
}

function getSyntheticPatientList() {
  return PREDEFINED_SYNTHETIC_PATIENTS.map((p) => ({
    ...p,
    patientRefHash: generatePatientRefHash(p.syntheticId, p.dob),
  }));
}

module.exports = {
  verifySyntheticIdentity,
  getSyntheticPatientList,
};
