/**
 * MedraLink Agentic AI Multi-Agent Orchestration Engine
 * Composition & Facade Layer for the 5 Autonomous Specialized Agents:
 * 1. ConsentAgent (Dynamic PDPO 2025 policy evaluation & token invariant validation)
 * 2. FHIRAgent (Semantic normalization to HL7 FHIR R4 with SNOMED-CT, LOINC, RxNorm)
 * 3. EmergencyTriageAgent (Trauma vital evaluation, GCS & Shock Index triage, 60-min break-glass token)
 * 4. AuditAgent (Ledger block forensic analysis, anomalous pattern recognition, BMDC dossier generation)
 * 5. MedraLinkOrchestrator (Master DAG execution planner & 3-tier memory manager)
 */

const { ONTOLOGY_MAP } = require('./agents/ontology');
const { runConsentAgent } = require('./agents/consentAgent');
const { runFHIRAgent } = require('./agents/fhirAgent');
const { runEmergencyTriageAgent } = require('./agents/emergencyTriageAgent');
const { runAuditAgent } = require('./agents/auditAgent');
const { runMedraLinkOrchestrator } = require('./agents/orchestrator');

module.exports = {
  ONTOLOGY_MAP,
  runConsentAgent,
  runFHIRAgent,
  runEmergencyTriageAgent,
  runAuditAgent,
  runMedraLinkOrchestrator,
};
