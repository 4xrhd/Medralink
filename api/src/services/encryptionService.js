const crypto = require('crypto');
const { AES_MASTER_KEY } = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits standard for GCM

// Pre-buffered Master Key Cache to avoid per-request Buffer allocation & GC overhead
const KEY_BUFFER_CACHE = new Map();
const DEFAULT_KEY_BUFFER = Buffer.from(AES_MASTER_KEY, 'hex');
KEY_BUFFER_CACHE.set(AES_MASTER_KEY, DEFAULT_KEY_BUFFER);

function getKeyBuffer(keyHex) {
  if (!keyHex || keyHex === AES_MASTER_KEY) return DEFAULT_KEY_BUFFER;
  let buf = KEY_BUFFER_CACHE.get(keyHex);
  if (!buf) {
    buf = Buffer.from(keyHex, 'hex');
    if (KEY_BUFFER_CACHE.size < 50) {
      KEY_BUFFER_CACHE.set(keyHex, buf);
    }
  }
  return buf;
}

/**
 * Encrypts an off-chain FHIR Clinical Bundle using AES-256-GCM
 * Returns { ciphertextHex, ivHex, authTagHex, recordHash }
 */
function encryptFHIRBundle(fhirBundle, masterKeyHex = AES_MASTER_KEY) {
  const key = getKeyBuffer(masterKeyHex);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = typeof fhirBundle === 'string' ? fhirBundle : JSON.stringify(fhirBundle);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Compute record integrity hash over the ciphertext
  const recordHash = crypto.createHash('sha256').update(encrypted).digest('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    recordHash,
    algorithm: ALGORITHM,
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Decrypts an off-chain encrypted FHIR payload using AES-256-GCM
 */
function decryptFHIRBundle(encryptedPayload, masterKeyHex = AES_MASTER_KEY) {
  try {
    const key = getKeyBuffer(masterKeyHex);
    const iv = Buffer.from(encryptedPayload.iv, 'hex');
    const authTag = Buffer.from(encryptedPayload.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedPayload.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`AES-256-GCM Decryption failed: ${err.message}`);
  }
}

module.exports = {
  encryptFHIRBundle,
  decryptFHIRBundle,
};
