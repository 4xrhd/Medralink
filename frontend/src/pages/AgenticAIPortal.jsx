import React, { useState, useEffect } from 'react';
import {
  Bot,
  Cpu,
  ShieldAlert,
  FileCode,
  Flame,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Terminal,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AgenticAIPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  const [agentStatus, setAgentStatus] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState('CLINICAL_INTAKE_AND_RECORD_ANCHOR');
  const [dagResult, setDagResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestrator'); // orchestrator, fhirAgent, consentAgent, emergencyAgent, auditAgent

  // Custom agent inputs
  const [rawNotesInput, setRawNotesInput] = useState(
    'Patient with history of severe penicillin anaphylaxis and type 2 diabetes mellitus. Current Rx: Metformin 500mg daily. Recent lab: Fasting glucose 7.8 mmol/L.'
  );
  const [traumaVitals, setTraumaVitals] = useState({
    gcs: 7,
    systolicBP: 82,
    diastolicBP: 48,
    heartRate: 134,
    spo2: 88,
  });
  const [agentOutput, setAgentOutput] = useState(null);

  useEffect(() => {
    api.getAgentStatus().then(setAgentStatus).catch(console.error);
  }, []);

  const handleRunDAG = async () => {
    setLoading(true);
    setDagResult(null);
    try {
      const patientHash = activePatient?.patientRefHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const payload = {
        patientRefHash: patientHash,
        rawNotes: rawNotesInput,
        clinicianId: 'DR-RAHMAN-8821',
        traumaVitals,
        declaredReasonCode: 'UNCONSCIOUS_TRAUMA_PATIENT',
        locationOrg: 'Org2MSP',
        activeConsent: {
          consentId: 'CONSENT-DEMO-AGENT',
          scope: ['CLINICAL_RECORDS'],
          purpose: 'DIRECT_TREATMENT',
          expiryTimestamp: Math.floor(Date.now() / 1000) + 7200,
          revoked: false,
        },
      };

      const res = await api.orchestrateDAG(selectedWorkflow, payload);
      setDagResult(res);
      if (res.results?.consentAgent?.verdict) {
        showTransactionReceipt({
          txId: `DAG-${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
          txType: 'Agentic_DAG_Orchestration',
          endorsingOrgs: ['Org1MSP', 'Org3MSP'],
          blockNumber: 'DAG-State',
          status: 'SUCCESS',
        });
      }
    } catch (err) {
      alert(`DAG execution failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFHIRAgent = async () => {
    setLoading(true);
    setAgentOutput(null);
    try {
      const patientHash = activePatient?.patientRefHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const res = await api.normalizeFHIR({
        patientRefHash: patientHash,
        rawNotes: rawNotesInput,
        labResults: { glucose: 7.8, hba1c: 6.9 },
      });
      setAgentOutput({ type: 'FHIRAgent', data: res });
    } catch (err) {
      alert(`FHIRAgent failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEmergencyTriage = async () => {
    setLoading(true);
    setAgentOutput(null);
    try {
      const patientHash = activePatient?.patientRefHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const res = await api.triageEmergency({
        clinicianId: 'DR-EMERGENCY-02',
        patientRefHash: patientHash,
        traumaVitals,
        declaredReasonCode: 'UNCONSCIOUS_TRAUMA_PATIENT',
        locationOrg: 'Org2MSP',
      });
      setAgentOutput({ type: 'EmergencyTriageAgent', data: res });
    } catch (err) {
      alert(`EmergencyTriageAgent failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAuditScan = async () => {
    setLoading(true);
    setAgentOutput(null);
    try {
      const res = await api.auditScan();
      setAgentOutput({ type: 'AuditAgent', data: res });
    } catch (err) {
      alert(`AuditAgent scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  MedraLink Agentic AI Multi-Agent Orchestration Layer
                </h1>
                <p className="text-sm text-indigo-300 font-medium">
                  5 Autonomous Specialized Agents • Directed Acyclic Graph (DAG) • 3-Tier Memory Hierarchy
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs font-mono text-indigo-300">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Multi-Agent Engine: ONLINE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          </div>
        </div>
      </div>

      {/* 5 Specialized Autonomous Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          {
            name: 'ConsentAgent',
            icon: ShieldAlert,
            color: 'teal',
            desc: 'Dynamic PDPO 2025 consent policy evaluator & purpose-binding checker.',
            role: 'Policy Guard',
          },
          {
            name: 'FHIRAgent',
            icon: FileCode,
            color: 'blue',
            desc: 'Semantic ontology normalizer (SNOMED-CT, LOINC, RxNorm) to HL7 FHIR R4.',
            role: 'Semantic Mapper',
          },
          {
            name: 'EmergencyTriageAgent',
            icon: Flame,
            color: 'red',
            desc: 'Trauma vital triage (GCS, MAP) & 60-min time-boxed break-glass token dispatcher.',
            role: 'Life Safety',
          },
          {
            name: 'AuditAgent',
            icon: Search,
            color: 'amber',
            desc: 'Forensic block scanner, SIEM analyzer & DGHS compliance dossier generator.',
            role: 'Forensics',
          },
          {
            name: 'MedraLinkOrchestrator',
            icon: Layers,
            color: 'indigo',
            desc: 'Master DAG planner coordinating agent graph & 3-tier memory hierarchy.',
            role: 'DAG Planner',
          },
        ].map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-${agent.color}-500/10 border border-${agent.color}-500/30 text-${agent.color}-400`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {agent.role}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{agent.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{agent.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Autonomous</span>
                <span className="text-emerald-400">● Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'orchestrator', label: 'Master DAG Orchestrator', icon: Layers },
          { id: 'fhirAgent', label: 'FHIRAgent Sandbox', icon: FileCode },
          { id: 'emergencyAgent', label: 'EmergencyTriageAgent Sandbox', icon: Flame },
          { id: 'auditAgent', label: 'AuditAgent Forensic Scanner', icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setAgentOutput(null);
              }}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-400 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Master DAG Orchestrator */}
      {activeTab === 'orchestrator' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Select Multi-Agent Directed Acyclic Graph (DAG) Scenario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'CLINICAL_INTAKE_AND_RECORD_ANCHOR',
                  title: '1. Clinical Intake & Settlement',
                  agents: 'FHIRAgent ➔ ConsentAgent ➔ Fabric Ledger',
                  desc: 'Normalizes unstructured clinical note, verifies consent purpose-binding, and anchors record hash.',
                },
                {
                  id: 'EMERGENCY_TRAUMA_BREAK_GLASS',
                  title: '2. Trauma Break-Glass Protocol',
                  agents: 'EmergencyTriageAgent ➔ ConsentAgent Bypass ➔ 60-min Token',
                  desc: 'Evaluates trauma vitals (GCS/MAP), grants emergency override under PDPO Sec 24, alerts DGHS.',
                },
                {
                  id: 'FORENSIC_COMPLIANCE_SCAN',
                  title: '3. Forensic Ledger Scan',
                  agents: 'AuditAgent ➔ Cryptographic Verification ➔ DGHS Dossier',
                  desc: 'Parses immutable block sequence, validates SHA-256 hash chains, detects unreviewed break-glass tokens.',
                },
              ].map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflow(wf.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedWorkflow === wf.id
                      ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <h4 className="text-sm font-bold text-white mb-1">{wf.title}</h4>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-2">{wf.agents}</div>
                  <p className="text-xs text-slate-400">{wf.desc}</p>
                </button>
              ))}
            </div>

            {/* Input preview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Working Clinical Context / Patient Hash Input:
              </label>
              <div className="text-xs font-mono text-teal-300 break-all">
                {activePatient?.patientRefHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <button
              onClick={handleRunDAG}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Multi-Agent DAG Workflow...</span>
                </>
              ) : (
                <>
                  <PlayCircleIcon className="w-4 h-4" />
                  <span>Dispatch & Execute DAG Workflow</span>
                </>
              )}
            </button>
          </div>

          {/* DAG Execution Result */}
          {dagResult && (
            <div className="glass-panel p-6 space-y-6 border-indigo-500/40 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">DAG Execution Succeeded ({dagResult.dagId})</h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Workflow: {dagResult.workflowType} • Time: {dagResult.executionTimeMs}ms
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                    DAG_RESOLVED
                  </span>
                </div>
              </div>

              {/* 3-Tier Memory State */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Three-Tier Memory Hierarchy State
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Tier 1: Working Session</div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">{dagResult.threeTierMemoryHierarchy.tier1SessionMemory}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Tier 2: Knowledge Vector Index</div>
                    <div className="text-xs font-semibold text-indigo-300 mt-1">{dagResult.threeTierMemoryHierarchy.tier2VectorIndex}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Tier 3: Fabric Blockchain</div>
                    <div className="text-xs font-semibold text-teal-300 mt-1">{dagResult.threeTierMemoryHierarchy.tier3ImmutableLedger}</div>
                  </div>
                </div>
              </div>

              {/* Execution Steps Trace */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  DAG Node Execution Steps Trace
                </h4>
                <div className="space-y-2">
                  {dagResult.dagExecutionSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold flex items-center justify-center shrink-0">
                        {step.phase}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono">{step.action}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {step.targetAgent || step.orchestrator}
                          </span>
                        </div>
                        <p className="text-slate-400">{step.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: FHIRAgent Sandbox */}
      {activeTab === 'fhirAgent' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-400" />
              FHIRAgent Semantic Ontology Normalization Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Transform raw clinician text into validated HL7 FHIR R4 Bundles with SNOMED-CT, LOINC, and RxNorm terminology bindings.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Raw Unstructured Clinical Note / Prescription:</label>
            <textarea
              rows={4}
              value={rawNotesInput}
              onChange={(e) => setRawNotesInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleRunFHIRAgent}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run FHIRAgent Normalization
          </button>

          {agentOutput?.type === 'FHIRAgent' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">FHIRAgent Normalization Report</span>
                <span className="text-[10px] font-mono text-blue-400">
                  {agentOutput.data.ontologySummary.snomedCount} SNOMED • {agentOutput.data.ontologySummary.rxnormCount} RxNorm • {agentOutput.data.ontologySummary.loincCount} LOINC
                </span>
              </div>
              <div className="space-y-2">
                {agentOutput.data.reasoningTrail.map((r, i) => (
                  <div key={i} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                    <span className="text-blue-400">[{r.step}]</span>
                    <span>{r.message || `${r.extractedEntity} ➔ ${r.snomedCode || r.rxnormCode || r.loincCode} (${r.display})`}</span>
                  </div>
                ))}
              </div>
              <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
                {JSON.stringify(agentOutput.data.bundle, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: EmergencyTriageAgent Sandbox */}
      {activeTab === 'emergencyAgent' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              EmergencyTriageAgent Trauma Vital Evaluation Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Calculate Glasgow Coma Scale (GCS), Mean Arterial Pressure (MAP), and Shock Index to dispense 60-min emergency break-glass tokens.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block">GCS (3-15):</label>
              <input
                type="number"
                value={traumaVitals.gcs}
                onChange={(e) => setTraumaVitals({ ...traumaVitals, gcs: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Systolic BP (mmHg):</label>
              <input
                type="number"
                value={traumaVitals.systolicBP}
                onChange={(e) => setTraumaVitals({ ...traumaVitals, systolicBP: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Diastolic BP (mmHg):</label>
              <input
                type="number"
                value={traumaVitals.diastolicBP}
                onChange={(e) => setTraumaVitals({ ...traumaVitals, diastolicBP: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">Heart Rate (bpm):</label>
              <input
                type="number"
                value={traumaVitals.heartRate}
                onChange={(e) => setTraumaVitals({ ...traumaVitals, heartRate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block">SpO2 (%):</label>
              <input
                type="number"
                value={traumaVitals.spo2}
                onChange={(e) => setTraumaVitals({ ...traumaVitals, spo2: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            onClick={handleRunEmergencyTriage}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Evaluate Trauma Vitals & Generate Break-Glass Token
          </button>

          {agentOutput?.type === 'EmergencyTriageAgent' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-red-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">Emergency Triage Decision: {agentOutput.data.decision}</span>
                <span className="text-[10px] font-mono text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">
                  ESI Level {agentOutput.data.esiLevel} (Resuscitation)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">MAP</span>
                  <span className="font-bold text-white">{agentOutput.data.calculatedMetrics.map}</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">Shock Index</span>
                  <span className="font-bold text-red-400">{agentOutput.data.calculatedMetrics.shockIndex}</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">Emergency Token</span>
                  <span className="font-bold text-teal-400">{agentOutput.data.breakGlassToken.tokenId}</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">Valid Duration</span>
                  <span className="font-bold text-amber-400">60 Minutes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AuditAgent Forensic Scanner */}
      {activeTab === 'auditAgent' && (
        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              AuditAgent Forensic Scanner & DGHS Dossier Generator
            </h2>
            <p className="text-xs text-slate-400">
              Continuously parse ledger blocks, check SHA-256 hash continuity, and flag unreviewed emergency break-glass invocations.
            </p>
          </div>

          <button
            onClick={handleRunAuditScan}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Execute Forensic Ledger Scan
          </button>

          {agentOutput?.type === 'AuditAgent' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white">Forensic Scan Status: {agentOutput.data.auditScanStatus}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {agentOutput.data.scannedTelemetry.blocks} Blocks • {agentOutput.data.scannedTelemetry.transactions} Transactions Scanned
                </span>
              </div>
              <div className="space-y-2">
                {agentOutput.data.findings.map((f, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{f.metric}: {f.details}</span>
                    <span className="text-emerald-400 font-bold font-mono text-[10px]">{f.status}</span>
                  </div>
                ))}
              </div>
              {agentOutput.data.anomalies.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-400">Detected Anomalies / Review Pending:</div>
                  {agentOutput.data.anomalies.map((anom, i) => (
                    <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300">
                      <div className="font-bold text-amber-300">{anom.type} ({anom.anomalyId})</div>
                      <p className="mt-1 text-slate-400">{anom.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}
