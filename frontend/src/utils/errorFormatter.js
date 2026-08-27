/**
 * errorFormatter.js — Human-Friendly Error Translation for MedraLink
 * Translates technical blockchain, smart contract, and cryptographic errors
 * into clear, accessible language for doctors, patients, hospital admins, and evaluators.
 */

export function formatErrorMessage(errorInput) {
  if (!errorInput) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected issue occurred. Please try again.',
      action: 'Refresh the page or retry the operation.',
      category: 'general',
      raw: '',
    };
  }

  const rawMsg = typeof errorInput === 'string' 
    ? errorInput 
    : errorInput?.message || errorInput?.diagnostics || JSON.stringify(errorInput);

  const lower = rawMsg.toLowerCase();

  // 1. Consent Revoked
  if (lower.includes('revoked') || lower.includes('consent_revoked')) {
    return {
      title: 'Patient Permission Withdrawn (Consent Revoked)',
      message: 'The patient has explicitly cancelled permission for clinicians to access their health records.',
      context: 'Under Bangladesh Data Protection regulations (PDPO 2025), citizens have sovereign control over their records and can revoke access at any time.',
      action: 'To view these records, ask the patient to issue a new consent token from their Patient Portal. In life-threatening emergencies, use the Emergency Portal break-glass override.',
      category: 'consent',
      raw: rawMsg,
    };
  }

  // 2. No Active Consent Found
  if (lower.includes('no active on-chain consent') || lower.includes('consent not found') || lower.includes('not authorized by consent')) {
    return {
      title: 'No Active Permission on Record',
      message: 'No active digital consent token was found allowing access to this patient’s medical data.',
      context: 'Hospitals cannot share or view medical history without explicit patient authorization anchored on the secure network.',
      action: 'Ask the patient to log into their Patient Portal and select "Grant Granular Consent" to authorize your clinic.',
      category: 'consent',
      raw: rawMsg,
    };
  }

  // 3. Scope Mismatch (Data Minimization)
  if (lower.includes('scope') && (lower.includes('not covered') || lower.includes('mismatch') || lower.includes('not authorized'))) {
    return {
      title: 'Clinical Category Not Permitted',
      message: 'The patient shared some records, but did not grant permission for this specific medical category (e.g. Lab Reports, Medications, or Allergies).',
      context: 'MedraLink enforces Data Minimization: doctors only receive the specific categories of data the patient explicitly approved.',
      action: 'Ask the patient to check the box for this clinical resource category in the Patient Portal consent form.',
      category: 'privacy',
      raw: rawMsg,
    };
  }

  // 4. Purpose Mismatch
  if (lower.includes('purpose') && (lower.includes('mismatch') || lower.includes('declared purpose'))) {
    return {
      title: 'Access Reason Mismatch (Purpose Binding)',
      message: 'The declared reason for accessing this file (e.g. Research) does not match the reason the patient consented to (e.g. Direct Treatment).',
      context: 'Purpose-Binding invariants ensure patient data cannot be used for secondary or unapproved reasons.',
      action: 'Select the matching purpose (e.g. "Clinical Direct Treatment") in the request dropdown.',
      category: 'privacy',
      raw: rawMsg,
    };
  }

  // 5. Expired Consent Token
  if (lower.includes('expired') && lower.includes('consent')) {
    return {
      title: 'Consent Token Expired',
      message: 'The time limit set by the patient on this digital permission token has passed.',
      context: 'All patient permissions are time-boxed to prevent indefinite or outdated access to personal records.',
      action: 'Ask the patient to issue a fresh consent grant with a new expiration date.',
      category: 'consent',
      raw: rawMsg,
    };
  }

  // 6. Ciphertext Tamper / Integrity Hash Mismatch
  if (lower.includes('integrity') || lower.includes('hash mismatch') || lower.includes('tamper')) {
    return {
      title: 'Security Alert: Data Integrity Fingerprint Mismatch',
      message: 'The encrypted record retrieved from the hospital repository does not match the permanent cryptographic fingerprint anchored on the ledger.',
      context: 'MedraLink automatically blocks decryption when off-chain files show signs of corruption or tampering.',
      action: 'Decryption blocked for safety. Notify the hospital IT administrator to verify repository storage backups.',
      category: 'security',
      raw: rawMsg,
    };
  }

  // 7. Emergency Break-Glass Window Expired
  if (lower.includes('emergency') && lower.includes('expired')) {
    return {
      title: 'Emergency Break-Glass Window Expired',
      message: 'The 60-minute emergency access window granted during resuscitation has ended.',
      context: 'Emergency overrides are strictly time-boxed to 60 minutes to prevent unauthorized continuous browsing.',
      action: 'If the patient is still in emergency care, submit a renewed emergency assessment request with updated vitals.',
      category: 'emergency',
      raw: rawMsg,
    };
  }

  // 8. Emergency ID Not Found
  if (lower.includes('emergency') && lower.includes('not found')) {
    return {
      title: 'Emergency Token Not Found',
      message: 'The specified emergency override token could not be verified on the network.',
      context: 'All break-glass events must have an authorized record anchored before hospital vaults will decrypt.',
      action: 'Return to the Emergency Portal to submit a verified trauma resuscitation request first.',
      category: 'emergency',
      raw: rawMsg,
    };
  }

  // 9. Role-Based Access Control (403 Forbidden)
  if (lower.includes('role') && (lower.includes('forbidden') || lower.includes('not authorized') || lower.includes('access forbidden'))) {
    return {
      title: 'Role Authorization Required',
      message: 'Your current login role does not have permission to execute this administrative or clinical action.',
      context: 'RoleGuard enforces strict separation of duties between Patients, Clinicians, Emergency Staff, Auditors, and Admins.',
      action: 'Use the top navigation bar to switch to the required role (e.g. Admin, Clinician, or Auditor).',
      category: 'auth',
      raw: rawMsg,
    };
  }

  // 10. Network / Gateway Connection Error
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('econnrefused')) {
    return {
      title: 'API Gateway Unreachable',
      message: 'Unable to connect to the MedraLink local API gateway service.',
      context: 'The web browser cannot reach the backend server at port 3001.',
      action: 'Ensure the backend is running with "make api" or "npm start" in the api directory.',
      category: 'network',
      raw: rawMsg,
    };
  }

  // Fallback for other errors
  return {
    title: 'Operation Could Not Complete',
    message: rawMsg.replace(/^Error:\s*/, ''),
    context: 'The secure network was unable to validate or process this action.',
    action: 'Review your selected inputs and try again, or check the system status in the Consortium Admin portal.',
    category: 'general',
    raw: rawMsg,
  };
}
