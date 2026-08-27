import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Banner() {
  return (
    <div className="bg-slate-900 border-b border-slate-800 py-2 text-xs text-slate-300">
      <div className="app-container flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-normal text-slate-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-slate-200 font-semibold">PROTOTYPE ENVIRONMENT:</strong> Synthetic Data & Mock Adapter | Zero PII / NID stored on blockchain ledger.
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-xs">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Zero PII on Ledger
          </span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-300 font-mono hidden md:inline">Channel: medralink-main</span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-300 font-mono hidden md:inline">Consensus: Raft CFT</span>
        </div>
      </div>
    </div>
  );
}
