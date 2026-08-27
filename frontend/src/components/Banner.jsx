import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Banner() {
  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-teal-500/20 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between text-amber-200">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-300">BCOLBD 2026 PROTOTYPE COMPLIANCE:</strong> SYNTHETIC DATA & MOCK ADAPTER — No real National ID (NID) or protected health information is stored on-chain.
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 sm:mt-0 text-slate-300 text-[11px]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          Zero PII on Ledger
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-teal-300 font-mono">Channel: medralink-main</span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-300 font-mono">Consensus: Raft (CFT)</span>
      </div>
    </div>
  );
}
