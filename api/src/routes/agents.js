const express = require('express');
const router = express.Router();
const {
  runConsentAgent,
  runFHIRAgent,
  runEmergencyTriageAgent,
  runAuditAgent,
  runMedraLinkOrchestrator,
  ONTOLOGY_MAP,
} = require('../services/agentsService');
const fabricService = require('../services/fabricService');
const { BadRequestError } = require('../utils/errors');

/**
 * Agentic AI Multi-Agent API Router
 */

// GET /agents/status - Overview of the 5 autonomous agents
router.get('/status', (req, res) => {
  res.json({
    status: 'ACTIVE',
    multiAgentFramework: 'MedraLink Autonomous Agentic AI Engine v1.0',
    compliance: 'PDPO 2025 (Bangladesh) & HL7 FHIR R4',
    agents: [
      {
        name: 'ConsentAgent',
        role: 'Autonomous dynamic consent & purpose-binding policy evaluator',
        active: true,
        protocol: 'PDPO_2025_RULE_ENGINE',
      },
      {
        name: 'FHIRAgent',
        role: 'Semantic normalization engine with SNOMED-CT / LOINC / RxNorm ontology bindings',
        active: true,
        protocol: 'HL7_FHIR_R4_ONTOLOGY_MAPPING',
      },
      {
        name: 'EmergencyTriageAgent',
        role: 'Trauma vital assessment, GCS/MAP triage, and 60-min break-glass token dispenser',
        active: true,
        protocol: 'ESI_TRIAGE_AND_BREAK_GLASS_POLICY',
      },
      {
        name: 'AuditAgent',
        role: 'Forensic ledger scanner, anomaly detection, and DGHS/BMDC evidence builder',
        active: true,
        protocol: 'FORENSIC_BLOCK_PARSER',
      },
      {
        name: 'MedraLinkOrchestrator',
        role: 'Master DAG workflow planner and 3-tier memory hierarchy manager',
        active: true,
        protocol: 'DAG_ORCHESTRATION_AND_LEDGER_SETTLEMENT',
      },
    ],
  });
});

// GET /agents/ontology - Returns supported clinical terminologies
router.get('/ontology', (req, res) => {
  res.json(ONTOLOGY_MAP);
});

// POST /agents/orchestrate - Master DAG Planner
router.post('/orchestrate', async (req, res, next) => {
  try {
    const { workflowType, inputPayload } = req.body;
    if (!workflowType) {
      throw new BadRequestError('workflowType is required (e.g. CLINICAL_INTAKE_AND_RECORD_ANCHOR, EMERGENCY_TRAUMA_BREAK_GLASS, FORENSIC_COMPLIANCE_SCAN)');
    }

    const payload = inputPayload || {};
    // If not provided in payload, inject current fabric state for audit scans
    if (workflowType === 'FORENSIC_COMPLIANCE_SCAN') {
      payload.blocks = await fabricService.getBlocks();
      payload.txHistory = fabricService.txHistory;
      payload.emergencyEvents = await fabricService.getAllEmergencyEvents();
    }

    const result = runMedraLinkOrchestrator({ workflowType, inputPayload: payload });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /agents/fhir-normalize - Invoke FHIRAgent
router.post('/fhir-normalize', (req, res, next) => {
  try {
    const { patientRefHash, rawNotes, vitals, allergyText, medicationText, labResults } = req.body;
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    const result = runFHIRAgent({ patientRefHash, rawNotes, vitals, allergyText, medicationText, labResults });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /agents/consent-evaluate - Invoke ConsentAgent
router.post('/consent-evaluate', (req, res, next) => {
  try {
    const { patientRefHash, requesterId, requesterRole, requestedScope, purpose, activeConsent, emergencyContext } = req.body;
    if (!patientRefHash) {
      throw new BadRequestError('patientRefHash is required');
    }
    const result = runConsentAgent({ patientRefHash, requesterId, requesterRole, requestedScope, purpose, activeConsent, emergencyContext });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /agents/emergency-triage - Invoke EmergencyTriageAgent
router.post('/emergency-triage', (req, res, next) => {
  try {
    const { clinicianId, patientRefHash, traumaVitals, declaredReasonCode, locationOrg } = req.body;
    if (!clinicianId || !patientRefHash) {
      throw new BadRequestError('clinicianId and patientRefHash are required');
    }
    const result = runEmergencyTriageAgent({ clinicianId, patientRefHash, traumaVitals, declaredReasonCode, locationOrg });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /agents/audit-scan - Invoke AuditAgent
router.post('/audit-scan', async (req, res, next) => {
  try {
    const { filterPatientRefHash } = req.body || {};
    const emergencyEvents = await fabricService.getAllEmergencyEvents();
    const result = runAuditAgent({
      blocks: await fabricService.getBlocks(),
      txHistory: fabricService.txHistory,
      emergencyEvents,
      filterPatientRefHash,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
