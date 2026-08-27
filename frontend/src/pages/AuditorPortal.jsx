import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, XCircle, Layers, RefreshCw, Database, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuditorPortal() {
  const { showTransactionReceipt } = useAuth();
  const [emergencyEvents, setEmergencyEvents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [findingsNote, setFindingsNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emgRes, blkRes] = await Promise.all([
        api.getAllEmergencyEvents().catch(() => ({ events: [] })),
        api.getBlocks().catch(() => ({ blocks: [] })),
      ]);
      setEmergencyEvents(emgRes.events || []);
      setBlocks(blkRes.blocks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = api.subscribeEvents(() => {
      fetchData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleReview = async (emergencyId, reviewStatus) => {
    try {
      const res = await api.reviewEmergency({
        emergencyId,
        reviewStatus,
        findingsNote: findingsNote || `Auditor verdict: ${reviewStatus}`,
      });

      showTransactionReceipt({
        message: `Emergency review anchored on ledger (ReviewEmergencyAccess: ${reviewStatus})`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });

      setFindingsNote('');
      setSelectedEmergency(null);
      await fetchData();
    } catch (err) {
      alert(`Review submission failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Network Auditor & DGHS Console</h1>
            <p className="text-xs text-slate-400">DGHS Compliance Authority • Identity: <span className="text-slate-300 font-mono">OU=Auditor, OrgAuditorMSP</span></p>
          </div>
        </div>

        <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-850 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Emergency Break-Glass Reviews */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Emergency Break-Glass Audit Reviews ({emergencyEvents.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Tx: ReviewEmergencyAccess</span>
          </div>

          <p className="text-xs text-slate-400">
            Under consortium governance rules, all emergency break-glass sessions must be verified post-hoc by a licensed auditor.
          </p>

          <div className="space-y-3">
            {emergencyEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No emergency break-glass invocations recorded.
              </div>
            ) : (
              emergencyEvents.map((emg) => (
                <div key={emg.emergencyId} className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300 font-medium">
                      ID: {emg.emergencyId.substring(0, 16)}...
                    </span>
                    <span className={`badge-status ${emg.reviewStatus === 'APPROPRIATE' ? 'badge-granted' : emg.reviewStatus === 'INAPPROPRIATE' ? 'badge-revoked' : 'badge-pending'}`}>
                      {emg.reviewStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    Reason: <strong className="text-rose-300">{emg.reasonCode}</strong>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400">
                    Patient Ref: {emg.patientRefHash.substring(0, 20)}...
                  </div>

                  {(emg.reviewStatus === 'PENDING' || emg.reviewStatus === 'PENDING_DGHS_POST_HOC_REVIEW') ? (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <input
                        type="text"
                        placeholder="Audit justification note..."
                        value={findingsNote}
                        onChange={(e) => setFindingsNote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1 text-xs text-slate-200"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(emg.emergencyId, 'APPROPRIATE')}
                          className="flex-1 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark APPROPRIATE
                        </button>
                        <button
                          onClick={() => handleReview(emg.emergencyId, 'INAPPROPRIATE')}
                          className="flex-1 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Flag INAPPROPRIATE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-teal-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                      Auditor Findings Hash: {emg.findingsHash?.substring(0, 24)}... (Reviewed)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Blockchain Block Explorer */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Hyperledger Fabric Block Explorer
            </h2>
            <span className="badge-status badge-granted text-[10px]">Channel: medralink-main</span>
          </div>

          <p className="text-xs text-slate-400">
            Real-time Raft block commitments. Inspect block numbers, previous hash chains, and transaction payloads.
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {blocks.map((blk) => (
              <div key={blk.blockNumber} className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-teal-400 font-bold">Block #{blk.blockNumber}</span>
                  <span className="text-[10px] text-slate-500">{new Date(blk.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="text-[10px] text-slate-400 space-y-1">
                  <div className="truncate">
                    <span className="text-slate-600">Data Hash: </span>
                    <span className="text-slate-300">{blk.dataHash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-600">Prev Hash: </span>
                    <span className="text-slate-500">{blk.previousHash}</span>
                  </div>
                </div>

                {blk.transactions && blk.transactions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {blk.transactions.map((tx) => (
                      <div key={tx.txId} className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px]">
                        <span className="text-teal-400 font-semibold">{tx.txType}</span>
                        <span className="text-slate-500 block truncate">TxId: {tx.txId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
