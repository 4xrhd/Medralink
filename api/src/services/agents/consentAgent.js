/**
 * ConsentAgent
 * Evaluates access requests against dynamic Bangladesh PDPO 2025 consent policies and on-chain state.
 */

function runConsentAgent({ patientRefHash, requesterId, requesterRole, requestedScope, purpose, activeConsent, emergencyContext }) {
  const stepLog = [];

  stepLog.push({
    step: 'INITIALIZE',
    agent: 'ConsentAgent',
    message: `Evaluating access request by ${requesterId} (${requesterRole}) for patient ${patientRefHash ? patientRefHash.slice(0, 12) : 'N/A'}...`,
  });

  // Rule 1: Emergency Break-Glass Override Check
  if (emergencyContext && emergencyContext.isEmergency) {
    stepLog.push({
      step: 'RULE_EMERGENCY_OVERRIDE',
      agent: 'ConsentAgent',
      rule: 'PDPO_SEC_24_EMERGENCY_EXCEPTION',
      status: 'OVERRIDDEN',
      reason: 'Emergency Break-Glass token active. Consent check bypassed per Bangladesh PDPO Section 24 life-safety exemption.',
    });
    return {
      agent: 'ConsentAgent',
      verdict: 'PERMITTED_EMERGENCY',
      policyDecision: 'ALLOW',
      ruleEvaluations: stepLog,
      timestamp: new Date().toISOString(),
      governanceRef: 'PDPO_2025_SEC_24_LIFE_SAFETY',
    };
  }

  // Rule 2: Active Consent Existence Check
  if (!activeConsent) {
    stepLog.push({
      step: 'RULE_CONSENT_EXISTS',
      agent: 'ConsentAgent',
      rule: 'PDPO_SEC_18_EXPLICIT_CONSENT',
      status: 'FAIL_CLOSED',
      reason: 'Zero active consent token discovered on Hyperledger Fabric ledger for this requester/patient pair.',
    });
    return {
      agent: 'ConsentAgent',
      verdict: 'DENIED_NO_CONSENT',
      policyDecision: 'DENY',
      ruleEvaluations: stepLog,
      timestamp: new Date().toISOString(),
      governanceRef: 'PDPO_2025_SEC_18_MANDATORY_CONSENT',
    };
  }

  // Rule 3: Temporal Expiry Check
  const now = Math.floor(Date.now() / 1000);
  if (activeConsent.expiryTimestamp && Number(activeConsent.expiryTimestamp) < now) {
    stepLog.push({
      step: 'RULE_TEMPORAL_VALIDITY',
      agent: 'ConsentAgent',
      rule: 'CONSENT_EXPIRATION_INVARIANT',
      status: 'FAIL_CLOSED',
      reason: `Consent token expired at Unix timestamp ${activeConsent.expiryTimestamp} (Current: ${now}).`,
    });
    return {
      agent: 'ConsentAgent',
      verdict: 'DENIED_EXPIRED_CONSENT',
      policyDecision: 'DENY',
      ruleEvaluations: stepLog,
      timestamp: new Date().toISOString(),
      governanceRef: 'PDPO_2025_SEC_20_TEMPORAL_LIMIT',
    };
  }

  // Rule 4: Revocation Status Check
  if (activeConsent.revoked || activeConsent.status === 'REVOKED') {
    stepLog.push({
      step: 'RULE_REVOCATION_STATUS',
      agent: 'ConsentAgent',
      rule: 'RIGHT_TO_REVOCATION',
      status: 'FAIL_CLOSED',
      reason: 'Patient actively exercised right to consent revocation on Fabric ledger.',
    });
    return {
      agent: 'ConsentAgent',
      verdict: 'DENIED_REVOKED_CONSENT',
      policyDecision: 'DENY',
      ruleEvaluations: stepLog,
      timestamp: new Date().toISOString(),
      governanceRef: 'PDPO_2025_SEC_21_RIGHT_TO_REVOKE',
    };
  }

  // Rule 5: Scope & Purpose Binding
  const declaredScope = activeConsent.scope || [];
  const declaredPurpose = activeConsent.purpose || 'DIRECT_TREATMENT';

  const scopeMatch = !requestedScope || declaredScope.includes(requestedScope) || declaredScope.includes('ALL') || declaredScope.includes('CLINICAL_RECORDS');
  const purposeMatch = !purpose || purpose === declaredPurpose || declaredPurpose === 'ALL' || declaredPurpose === 'EMERGENCY_CARE';

  if (!scopeMatch || !purposeMatch) {
    stepLog.push({
      step: 'RULE_PURPOSE_BINDING',
      agent: 'ConsentAgent',
      rule: 'PURPOSE_LIMITATION_INVARIANT',
      status: 'FAIL_CLOSED',
      reason: `Requested scope (${requestedScope}) or purpose (${purpose}) exceeds granted consent boundaries (${declaredScope.join(', ')} / ${declaredPurpose}).`,
    });
    return {
      agent: 'ConsentAgent',
      verdict: 'DENIED_SCOPE_MISMATCH',
      policyDecision: 'DENY',
      ruleEvaluations: stepLog,
      timestamp: new Date().toISOString(),
      governanceRef: 'PDPO_2025_SEC_19_PURPOSE_SPECIFICATION',
    };
  }

  stepLog.push({
    step: 'RULE_SUCCESS',
    agent: 'ConsentAgent',
    rule: 'ALL_CONSTRAINTS_SATISFIED',
    status: 'PASS',
    reason: `Consent token ${activeConsent.consentId} is valid, unrevoked, unexpired, and purpose-bound.`,
  });

  return {
    agent: 'ConsentAgent',
    verdict: 'PERMITTED_ACTIVE_CONSENT',
    policyDecision: 'ALLOW',
    consentId: activeConsent.consentId,
    ruleEvaluations: stepLog,
    timestamp: new Date().toISOString(),
    governanceRef: 'PDPO_2025_COMPLIANT',
  };
}

module.exports = {
  runConsentAgent,
};
