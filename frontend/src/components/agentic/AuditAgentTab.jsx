import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function AuditAgentTab({
  onRunAuditScan,
  loading,
  agentOutput,
}) {
  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          AuditAgent Forensic Scanner & DGHS Dossier Generator
        </h2>
        <p className="text-xs text-slate-400">
          Continuously parse ledger blocks, check SHA-256 hash continuity, and flag unreviewed emergency break-glass invocations.
        </p>
      </div>

      <button
        onClick={onRunAuditScan}
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
      >
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        Execute Forensic Ledger Scan
      </button>

      {agentOutput?.type === 'AuditAgent' && (
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200">Forensic Scan Status: {agentOutput.data.auditScanStatus}</span>
            <span className="text-2xs font-mono text-slate-400">
              {agentOutput.data.scannedTelemetry?.blocks || 0} Blocks • {agentOutput.data.scannedTelemetry?.transactions || 0} Transactions Scanned
            </span>
          </div>
          {agentOutput.data.findings && (
            <div className="space-y-2">
              {agentOutput.data.findings.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-300">{f.metric}: {f.details}</span>
                  <span className="text-emerald-400 font-medium font-mono text-2xs">{f.status}</span>
                </div>
              ))}
            </div>
          )}
          {agentOutput.data.anomalies && agentOutput.data.anomalies.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-amber-400">Detected Anomalies / Review Pending:</div>
              {agentOutput.data.anomalies.map((anom, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900 border border-amber-500/20 text-xs text-slate-300">
                  <div className="font-semibold text-amber-300">{anom.type} ({anom.anomalyId})</div>
                  <p className="mt-1 text-slate-400">{anom.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
