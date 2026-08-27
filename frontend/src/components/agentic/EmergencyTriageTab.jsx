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
        onClick={onRunEmergencyTriage}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
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
              <span className="font-bold text-white">{agentOutput.data.calculatedMetrics?.map}</span>
            </div>
            <div className="p-2 rounded bg-slate-900">
              <span className="text-slate-400 block text-[10px]">Shock Index</span>
              <span className="font-bold text-red-400">{agentOutput.data.calculatedMetrics?.shockIndex}</span>
            </div>
            <div className="p-2 rounded bg-slate-900">
              <span className="text-slate-400 block text-[10px]">Emergency Token</span>
              <span className="font-bold text-teal-400">{agentOutput.data.breakGlassToken?.tokenId}</span>
            </div>
            <div className="p-2 rounded bg-slate-900">
              <span className="text-slate-400 block text-[10px]">Valid Duration</span>
              <span className="font-bold text-amber-400">60 Minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
