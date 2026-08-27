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
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-teal-400" />
          FHIRAgent Semantic Ontology Normalization Sandbox
        </h2>
        <p className="text-xs text-slate-400">
          Transform raw clinician text into validated HL7 FHIR R4 Bundles with SNOMED-CT, LOINC, and RxNorm terminology bindings.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Raw Unstructured Clinical Note / Prescription:</label>
        <textarea
          rows={4}
          value={rawNotesInput}
          onChange={(e) => setRawNotesInput(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all leading-relaxed"
        />
      </div>

      <button
        onClick={onRunFHIRAgent}
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        Run FHIRAgent Normalization
      </button>

      {agentOutput?.type === 'FHIRAgent' && (
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200">FHIRAgent Normalization Report</span>
            <span className="text-2xs font-mono text-teal-400">
              {agentOutput.data.ontologySummary?.snomedCount || 0} SNOMED • {agentOutput.data.ontologySummary?.rxnormCount || 0} RxNorm • {agentOutput.data.ontologySummary?.loincCount || 0} LOINC
            </span>
          </div>
          {agentOutput.data.reasoningTrail && (
            <div className="space-y-2">
              {agentOutput.data.reasoningTrail.map((r, i) => (
                <div key={i} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-teal-400">[{r.step}]</span>
                  <span>{r.message || `${r.extractedEntity} ➔ ${r.snomedCode || r.rxnormCode || r.loincCode} (${r.display})`}</span>
                </div>
              ))}
            </div>
          )}
          <pre className="p-3 bg-slate-900/90 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-60 border border-slate-800">
            {JSON.stringify(agentOutput.data.bundle, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
