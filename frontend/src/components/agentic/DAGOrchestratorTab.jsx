import React from 'react';
import { Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

const WORKFLOW_PRESETS = [
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
];

export default function DAGOrchestratorTab({
  selectedWorkflow,
  setSelectedWorkflow,
  patientHash,
  onRunDAG,
  loading,
  dagResult,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Select Multi-Agent Directed Acyclic Graph (DAG) Scenario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_PRESETS.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedWorkflow === wf.id
                  ? 'bg-slate-800 border-teal-500/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <h4 className="text-xs font-bold text-slate-100 mb-1">{wf.title}</h4>
              <div className="text-xs font-mono text-teal-400 font-medium mb-1.5">{wf.agents}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{wf.desc}</p>
            </button>
          ))}
        </div>

        {/* Input preview */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 block">
            Working Clinical Context / Patient Hash Input:
          </label>
          <div className="text-xs font-mono text-slate-200 break-all">{patientHash}</div>
        </div>

        <button
          onClick={onRunDAG}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Multi-Agent DAG Workflow...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
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
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                DAG_RESOLVED
              </span>
            </div>
          </div>

          {/* 3-Tier Memory State */}
          {dagResult.threeTierMemoryHierarchy && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Three-Tier Memory Hierarchy State
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xs font-mono text-slate-400 uppercase">Tier 1: Working Session</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    {dagResult.threeTierMemoryHierarchy.tier1SessionMemory}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xs font-mono text-slate-400 uppercase">Tier 2: Knowledge Vector Index</div>
                  <div className="text-xs font-semibold text-indigo-300 mt-1">
                    {dagResult.threeTierMemoryHierarchy.tier2VectorIndex}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xs font-mono text-slate-400 uppercase">Tier 3: Fabric Blockchain</div>
                  <div className="text-xs font-semibold text-teal-300 mt-1">
                    {dagResult.threeTierMemoryHierarchy.tier3ImmutableLedger}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Execution Steps Trace */}
          {dagResult.dagExecutionSteps && (
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
                        <span className="text-2xs font-mono text-slate-500">
                          {step.targetAgent || step.orchestrator}
                        </span>
                      </div>
                      <p className="text-slate-400">{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
