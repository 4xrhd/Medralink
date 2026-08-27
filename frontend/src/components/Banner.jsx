import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Banner() {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between text-slate-300">
      <div className="flex items-center gap-2 font-normal text-slate-300">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong className="text-slate-200 font-semibold">BCOLBD 2026 PROTOTYPE:</strong> Synthetic Data & Mock Adapter — Zero PII / NID stored on blockchain ledger.
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 sm:mt-0 text-slate-400 text-[11px]">
        <span className="flex items-center gap-1 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          Zero PII on Ledger
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300 font-mono">Channel: medralink-main</span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300 font-mono">Consensus: Raft CFT</span>
      </div>
    </div>
  );
}
