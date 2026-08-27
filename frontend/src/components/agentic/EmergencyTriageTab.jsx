import React from 'react';
import { Flame, RefreshCw, Activity } from 'lucide-react';

export default function EmergencyTriageTab({
  traumaVitals,
  setTraumaVitals,
  onRunEmergencyTriage,
  loading,
  agentOutput,
}) {
  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          EmergencyTriageAgent Trauma Vital Evaluation Sandbox
        </h2>
        <p className="text-xs text-slate-400">
          Calculate Glasgow Coma Scale (GCS), Mean Arterial Pressure (MAP), and Shock Index to dispense 60-min emergency break-glass tokens.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-slate-300 block font-mono font-semibold mb-1">GCS (3-15):</label>
          <input
            type="number"
            value={traumaVitals.gcs}
            onChange={(e) => setTraumaVitals({ ...traumaVitals, gcs: Number(e.target.value) })}
            className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 block font-mono font-semibold mb-1">Systolic BP:</label>
          <input
            type="number"
            value={traumaVitals.systolicBP}
            onChange={(e) => setTraumaVitals({ ...traumaVitals, systolicBP: Number(e.target.value) })}
            className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 block font-mono font-semibold mb-1">Diastolic BP:</label>
          <input
            type="number"
            value={traumaVitals.diastolicBP}
            onChange={(e) => setTraumaVitals({ ...traumaVitals, diastolicBP: Number(e.target.value) })}
            className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 block font-mono font-semibold mb-1">Heart Rate:</label>
          <input
            type="number"
            value={traumaVitals.heartRate}
            onChange={(e) => setTraumaVitals({ ...traumaVitals, heartRate: Number(e.target.value) })}
            className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-slate-300 block font-mono font-semibold mb-1">SpO2 (%):</label>
          <input
            type="number"
            value={traumaVitals.spo2}
            onChange={(e) => setTraumaVitals({ ...traumaVitals, spo2: Number(e.target.value) })}
            className="w-full bg-slate-950/80 border border-slate-750 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
          />
        </div>
      </div>

      <button
        onClick={onRunEmergencyTriage}
        disabled={loading}
        className="px-4 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
      >
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
        Evaluate Trauma Vitals & Generate Break-Glass Token
      </button>

      {agentOutput?.type === 'EmergencyTriageAgent' && (
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200">Emergency Triage Decision: {agentOutput.data.decision}</span>
            <span className="badge-status badge-emergency">
              ESI Level {agentOutput.data.esiLevel} (Resuscitation)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-2xs font-mono">MAP</span>
              <span className="font-bold text-slate-200">{agentOutput.data.calculatedMetrics?.map}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-2xs font-mono">Shock Index</span>
              <span className="font-bold text-rose-400">{agentOutput.data.calculatedMetrics?.shockIndex}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-2xs font-mono">Emergency Token</span>
              <span className="font-bold text-slate-200">{agentOutput.data.breakGlassToken?.tokenId}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-2xs font-mono">Valid Duration</span>
              <span className="font-bold text-slate-200">60 Minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
