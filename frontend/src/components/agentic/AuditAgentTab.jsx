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
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-400" />
          AuditAgent Forensic Scanner & DGHS Dossier Generator
        </h2>
        <p className="text-xs text-slate-400">
          Continuously parse ledger blocks, check SHA-256 hash continuity, and flag unreviewed emergency break-glass invocations.
        </p>
      </div>

      <button
        onClick={onRunAuditScan}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Execute Forensic Ledger Scan
      </button>

      {agentOutput?.type === 'AuditAgent' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">Forensic Scan Status: {agentOutput.data.auditScanStatus}</span>
            <span className="text-[10px] font-mono text-slate-400">
              {agentOutput.data.scannedTelemetry?.blocks || 0} Blocks • {agentOutput.data.scannedTelemetry?.transactions || 0} Transactions Scanned
            </span>
          </div>
          {agentOutput.data.findings && (
            <div className="space-y-2">
              {agentOutput.data.findings.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{f.metric}: {f.details}</span>
                  <span className="text-emerald-400 font-bold font-mono text-[10px]">{f.status}</span>
                </div>
              ))}
            </div>
          )}
          {agentOutput.data.anomalies && agentOutput.data.anomalies.length > 0 && (
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
  );
}
