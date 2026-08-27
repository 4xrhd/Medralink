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
    hospitalName: 'Hospital A (BSMMU / Pilot Facility)',
    primaryCondition: 'Severe Penicillin Anaphylaxis & Type 2 Diabetes',
    currentMeds: 'Metformin 500mg daily',
    knownAllergies: 'Penicillin (Severe Anaphylactic Shock)',
  },
  {
    syntheticId: 'BD-HEALTH-771204',
    dob: '1988-11-23',
    name: 'Fatema Begum (Synthetic)',
    gender: 'female',
    bloodGroup: 'O+',
    homeOrg: 'Org2MSP',
    hospitalName: 'Hospital B (Evercare Hospital Dhaka)',
    primaryCondition: 'Stage 3 Chronic Kidney Disease & Hypertension',
    currentMeds: 'Amlodipine 5mg, Losartan 50mg',
    knownAllergies: 'Sulfonamides / Sulfa Drugs (Severe Rash)',
  },
  {
    syntheticId: 'BD-HEALTH-451992',
    dob: '2001-02-09',
    name: 'Tanvir Hasan (Synthetic)',
    gender: 'male',
    bloodGroup: 'A+',
    homeOrg: 'Org1MSP',
    hospitalName: 'Hospital A (Dhaka Medical College ED)',
    primaryCondition: 'Acute Polytrauma & Traumatic Brain Injury (GCS 7)',
    currentMeds: 'Mannitol 20%, IV Ceftriaxone',
    knownAllergies: 'Aspirin (Bronchospasm Risk)',
  },
  {
    syntheticId: 'BD-HEALTH-618834',
    dob: '1996-08-17',
    name: 'Nusrat Jahan (Synthetic)',
    gender: 'female',
    bloodGroup: 'AB+',
    homeOrg: 'Org2MSP',
    hospitalName: 'Hospital B (Square Hospital / Ob-Gyn Dept)',
    primaryCondition: 'High-Risk Gestational Diabetes & Hypothyroidism',
    currentMeds: 'Levothyroxine 50 mcg, Insulin Glargine',
    knownAllergies: 'Ceftriaxone (Moderate Urticaria)',
  },
  {
    syntheticId: 'BD-HEALTH-883109',
    dob: '1964-04-12',
    name: 'Kazi Anisur Rahman (Synthetic)',
    gender: 'male',
    bloodGroup: 'A-',
    homeOrg: 'Org1MSP',
    hospitalName: 'Hospital A (National Heart Foundation / NICVD)',
    primaryCondition: 'Acute Coronary Syndrome (STEMI Post-PCI)',
    currentMeds: 'Atorvastatin 40mg, Clopidogrel 75mg, Bisoprolol 2.5mg',
    knownAllergies: 'No Known Drug Allergies (NKDA)',
  },
  {
    syntheticId: 'BD-HEALTH-520194',
    dob: '1981-10-05',
    name: 'Mst. Shirin Akhter (Synthetic)',
    gender: 'female',
    bloodGroup: 'O-',
    homeOrg: 'Org2MSP',
    hospitalName: 'Hospital B (BIRDEM General Hospital)',
    primaryCondition: 'Rheumatoid Arthritis & Chronic Bronchial Asthma',
    currentMeds: 'Methotrexate 15mg weekly, Salbutamol Inhaler',
    knownAllergies: 'NSAIDs / Ibuprofen (Severe Asthma Trigger)',
  },
  {
    syntheticId: 'BD-HEALTH-394012',
    dob: '1955-12-30',
    name: 'Md. Shafiqul Islam (Synthetic)',
    gender: 'male',
    bloodGroup: 'B-',
    homeOrg: 'Org1MSP',
    hospitalName: 'Hospital A (Dhaka Medical College)',
    primaryCondition: 'Congestive Heart Failure (NYHA Class III)',
    currentMeds: 'Furosemide 40mg, Enalapril 10mg, Digoxin 0.125mg',
    knownAllergies: 'ACE Inhibitors (Angioedema History)',
  },
  {
    syntheticId: 'BD-HEALTH-210948',
    dob: '2010-07-19',
    name: 'Ayesha Siddiqua (Synthetic)',
    gender: 'female',
    bloodGroup: 'AB-',
    homeOrg: 'Org2MSP',
    hospitalName: 'Hospital B (Dhaka Shishu Hospital)',
    primaryCondition: 'Beta Thalassemia Major & Iron Overload',
    currentMeds: 'Deferasirox 500mg, Folic Acid 5mg',
    knownAllergies: 'No Known Drug Allergies (NKDA)',
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
    warning: 'SYNTHETIC DATA | NO REAL NID STORED OR PROCESSED',
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
