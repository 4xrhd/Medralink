import React from 'react';
import { FileCode, RefreshCw, Sparkles } from 'lucide-react';

export default function FHIRAgentTab({
  rawNotesInput,
  setRawNotesInput,
  onRunFHIRAgent,
  loading,
  agentOutput,
}) {
  return (
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
        onClick={onRunFHIRAgent}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Run FHIRAgent Normalization
      </button>

      {agentOutput?.type === 'FHIRAgent' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">FHIRAgent Normalization Report</span>
            <span className="text-[10px] font-mono text-blue-400">
              {agentOutput.data.ontologySummary?.snomedCount || 0} SNOMED • {agentOutput.data.ontologySummary?.rxnormCount || 0} RxNorm • {agentOutput.data.ontologySummary?.loincCount || 0} LOINC
            </span>
          </div>
          {agentOutput.data.reasoningTrail && (
            <div className="space-y-2">
              {agentOutput.data.reasoningTrail.map((r, i) => (
                <div key={i} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-blue-400">[{r.step}]</span>
                  <span>{r.message || `${r.extractedEntity} ➔ ${r.snomedCode || r.rxnormCode || r.loincCode} (${r.display})`}</span>
                </div>
              ))}
            </div>
          )}
          <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
            {JSON.stringify(agentOutput.data.bundle, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
