const crypto = require('crypto');

/**
 * Generates standard SHA-256 hash
 */
function sha256(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates Salted SHA-256 for Pseudonymous Patient References
 * patientRefHash = SALTED_SHA256(syntheticId + dob, salt)
 */
function generatePatientRefHash(syntheticId, dob, salt = 'medralink_salt_2026') {
  return crypto.createHmac('sha256', salt).update(`${syntheticId}|${dob}`).digest('hex');
}

module.exports = {
  sha256,
  generatePatientRefHash,
};
