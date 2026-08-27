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
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Network Auditor & DGHS Console</h1>
            <p className="text-xs text-slate-400">DGHS Compliance Authority • Identity: <span className="text-amber-300 font-mono">OU=Auditor, OrgAuditorMSP (Read-Only Replica)</span></p>
          </div>
        </div>

        <button onClick={fetchData} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Emergency Break-Glass Reviews */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-400" />
              Emergency Break-Glass Audit Reviews ({emergencyEvents.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-500">Tx: ReviewEmergencyAccess</span>
          </div>

          <p className="text-xs text-slate-400">
            Under consortium governance rules, all emergency break-glass sessions must be verified post-hoc by a licensed auditor.
          </p>

          <div className="space-y-3">
            {emergencyEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No emergency break-glass invocations recorded.
              </div>
            ) : (
              emergencyEvents.map((emg) => (
                <div key={emg.emergencyId} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-300 font-bold">
                      ID: {emg.emergencyId.substring(0, 16)}...
                    </span>
                    <span className={`badge-status ${emg.reviewStatus === 'APPROPRIATE' ? 'badge-granted' : emg.reviewStatus === 'INAPPROPRIATE' ? 'badge-revoked' : 'badge-pending'}`}>
                      {emg.reviewStatus}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    Reason: <strong className="text-red-300">{emg.reasonCode}</strong>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400">
                    Patient Ref: {emg.patientRefHash.substring(0, 20)}...
                  </div>

                  {emg.reviewStatus === 'PENDING' ? (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <input
                        type="text"
                        placeholder="Audit justification note..."
                        value={findingsNote}
                        onChange={(e) => setFindingsNote(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(emg.emergencyId, 'APPROPRIATE')}
                          className="flex-1 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark APPROPRIATE
                        </button>
                        <button
                          onClick={() => handleReview(emg.emergencyId, 'INAPPROPRIATE')}
                          className="flex-1 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Flag INAPPROPRIATE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-teal-400 bg-slate-950/60 p-2 rounded">
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
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              Hyperledger Fabric Block Explorer
            </h2>
            <span className="badge-status badge-granted text-[10px]">Channel: medralink-main</span>
          </div>

          <p className="text-xs text-slate-400">
            Real-time Raft block commitments. Inspect block numbers, previous hash chains, and transaction payloads.
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {blocks.map((blk) => (
              <div key={blk.blockNumber} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-teal-300 font-bold">Block #{blk.blockNumber}</span>
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
                  <div className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[10px]">
                    <span className="text-teal-400 font-semibold">{blk.transactions[0].txType}</span>
                    <span className="text-slate-500 block truncate">TxId: {blk.transactions[0].txId}</span>
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
