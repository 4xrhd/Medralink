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
      <div className="glass-panel p-5 text-slate-100 shadow-xl relative border-slate-700/80 bg-slate-900/95">
        <button
          onClick={closeReceipt}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2.5 text-slate-100 font-semibold text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Ledger Transaction Committed</span>
        </div>

        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          {recentTransaction.message || 'Smart contract state transition anchored to Hyperledger Fabric channel.'}
        </p>

        <div className="space-y-2 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Block Height:
            </span>
            <span className="text-slate-200 font-bold">#{recentTransaction.blockNumber || '1'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> Tx ID:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-300">
                {(recentTransaction.txId || '0x...').substring(0, 16)}...
              </span>
              <button
                onClick={() => copyToClipboard(recentTransaction.txId)}
                title="Copy Tx ID"
                className="text-slate-400 hover:text-teal-400 transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Time:
            </span>
            <span className="text-slate-300">
              {recentTransaction.timestamp ? (
                recentTransaction.timestamp.includes('T')
                  ? new Date(recentTransaction.timestamp).toLocaleTimeString()
                  : recentTransaction.timestamp
              ) : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Endorsement: OR(Org1MSP, Org2MSP)</span>
          <span className="text-slate-500">medralink-main</span>
        </div>
      </div>
    </div>
  );
}
