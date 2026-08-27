import React, { useState, useEffect } from 'react';
import {
  Bot,
  Cpu,
  FileCode,
  Flame,
  Search,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DEMO_CONSTANTS } from '../utils/constants';
import AgentOverviewGrid from '../components/agentic/AgentOverviewGrid';
import DAGOrchestratorTab from '../components/agentic/DAGOrchestratorTab';
import FHIRAgentTab from '../components/agentic/FHIRAgentTab';
import EmergencyTriageTab from '../components/agentic/EmergencyTriageTab';
import AuditAgentTab from '../components/agentic/AuditAgentTab';

export default function AgenticAIPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  const [selectedWorkflow, setSelectedWorkflow] = useState('CLINICAL_INTAKE_AND_RECORD_ANCHOR');
  const [dagResult, setDagResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestrator');

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

  const patientHash = activePatient?.patientRefHash || DEMO_CONSTANTS.DEFAULT_PATIENT_REF_HASH;

  useEffect(() => {
    api.getAgentStatus().catch(console.error);
  }, []);

  const handleRunDAG = async () => {
    setLoading(true);
    setDagResult(null);
    try {
      const payload = {
        patientRefHash: patientHash,
        rawNotes: rawNotesInput,
        clinicianId: DEMO_CONSTANTS.DEFAULT_CLINICIAN_ID,
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
      const res = await api.triageEmergency({
        clinicianId: DEMO_CONSTANTS.DEFAULT_EMERGENCY_CLINICIAN_ID,
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

  const tabs = [
    { id: 'orchestrator', label: 'Master DAG Orchestrator', icon: Layers },
    { id: 'fhirAgent', label: 'FHIRAgent Sandbox', icon: FileCode },
    { id: 'emergencyAgent', label: 'EmergencyTriageAgent Sandbox', icon: Flame },
    { id: 'auditAgent', label: 'AuditAgent Forensic Scanner', icon: Search },
  ];

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
      <AgentOverviewGrid />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setAgentOutput(null);
              }}
              className={`flex items-center gap-2 pb-3 px-2 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
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

      {/* Tab Panels */}
      {activeTab === 'orchestrator' && (
        <DAGOrchestratorTab
          selectedWorkflow={selectedWorkflow}
          setSelectedWorkflow={setSelectedWorkflow}
          patientHash={patientHash}
          onRunDAG={handleRunDAG}
          loading={loading}
          dagResult={dagResult}
        />
      )}

      {activeTab === 'fhirAgent' && (
        <FHIRAgentTab
          rawNotesInput={rawNotesInput}
          setRawNotesInput={setRawNotesInput}
          onRunFHIRAgent={handleRunFHIRAgent}
          loading={loading}
          agentOutput={agentOutput}
        />
      )}

      {activeTab === 'emergencyAgent' && (
        <EmergencyTriageTab
          traumaVitals={traumaVitals}
          setTraumaVitals={setTraumaVitals}
          onRunEmergencyTriage={handleRunEmergencyTriage}
          loading={loading}
          agentOutput={agentOutput}
        />
      )}

      {activeTab === 'auditAgent' && (
        <AuditAgentTab
          onRunAuditScan={handleRunAuditScan}
          loading={loading}
          agentOutput={agentOutput}
        />
      )}
    </div>
  );
}
