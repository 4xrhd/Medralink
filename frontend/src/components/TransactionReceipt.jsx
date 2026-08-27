import React from 'react';
import { CheckCircle2, Copy, X, Layers, Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TransactionReceipt() {
  const { recentTransaction, closeReceipt } = useAuth();

  if (!recentTransaction) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in">
      <div className="glass-panel-glow p-5 text-slate-100 shadow-2xl relative border-teal-500/40">
        <button
          onClick={closeReceipt}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 text-teal-400 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <span>Ledger Transaction Committed</span>
        </div>

        <p className="text-xs text-slate-300 mb-3">
          {recentTransaction.message || 'Smart contract state transition anchored to Hyperledger Fabric channel.'}
        </p>

        <div className="space-y-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" /> Block Height:
            </span>
            <span className="text-teal-300 font-bold">#{recentTransaction.blockNumber || '1'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Tx ID:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-200">
                {(recentTransaction.txId || '0x...').substring(0, 16)}...
              </span>
              <button
                onClick={() => copyToClipboard(recentTransaction.txId)}
                title="Copy Tx ID"
                className="hover:text-teal-400"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Time:
            </span>
            <span className="text-slate-300">{recentTransaction.timestamp}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-teal-400/80">Endorsement: OR(Org1MSP, Org2MSP)</span>
          <span className="text-slate-500 font-mono">medralink-main</span>
        </div>
      </div>
    </div>
  );
}
