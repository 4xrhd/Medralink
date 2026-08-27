import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, Plus, Clock, FileText, CheckCircle, AlertCircle, History, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  const [consents, setConsents] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Grant Consent Form State
  const [grantee, setGrantee] = useState('DR_HASAN_CLINICIAN');
  const [scopeAllergy, setScopeAllergy] = useState(true);
  const [scopeMedication, setScopeMedication] = useState(true);
  const [scopeDiagnostic, setScopeDiagnostic] = useState(false);
  const [purpose, setPurpose] = useState('treatment');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patientRefHash = activePatient?.patientRefHash || 'c7e9a8b1d2f4567890abcdef1234567890abcdef1234567890abcdef12345678';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes, rRes] = await Promise.all([
        api.getPatientConsents(patientRefHash).catch(() => ({ consents: [] })),
        api.getAuditHistory(patientRefHash).catch(() => ({ auditTrail: [] })),
        api.getPatientRecords(patientRefHash).catch(() => ({ records: [] })),
      ]);
      setConsents(cRes.consents || []);
      setAuditTrail(aRes.auditTrail || []);
      setRecords(rRes.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientRefHash]);

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const scope = [];
      if (scopeAllergy) scope.push('AllergyIntolerance');
      if (scopeMedication) scope.push('MedicationRequest');
      if (scopeDiagnostic) scope.push('DiagnosticReport');

      if (scope.length === 0) {
        alert('Please select at least one granular clinical resource scope');
        return;
      }

      const res = await api.grantConsent({
        patientRefHash,
        grantee,
        scope,
        purpose,
        expiryDays,
      });

      showTransactionReceipt({
        message: 'Consent token recorded on Hyperledger Fabric ledger (GrantConsent)',
        txId: res.txId,
        blockNumber: res.blockNumber,
      });

      await fetchData();
    } catch (err) {
      alert(`Failed to grant consent: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConsent = async (consentId) => {
    if (!confirm('Are you sure you want to revoke this consent? All future clinician access requests will be immediately blocked.')) return;

    try {
      const res = await api.revokeConsent(consentId, patientRefHash);
      showTransactionReceipt({
        message: 'Consent successfully revoked on blockchain (RevokeConsent)',
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      await fetchData();
    } catch (err) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Profile & Bangladesh Smart Health Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 border-slate-800 flex flex-col justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xl">
              {activePatient?.name?.substring(0, 2) || 'RC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{activePatient?.name || 'Rahim Chowdhury (Synthetic)'}</h1>
                <span className="badge-status badge-granted text-[11px]">Identity Verified (Mock Adapter)</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                <span>Synthetic ID: <strong className="text-slate-200">{activePatient?.syntheticId || 'BD-HEALTH-994821'}</strong></span>
                <span>•</span>
                <span>Home Org: <strong className="text-teal-300">{activePatient?.homeOrg || 'Org1MSP (Hospital A)'}</strong></span>
                <span>•</span>
                <span>Blood: <strong className="text-slate-200">{activePatient?.bloodGroup || 'B+'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs font-mono w-full">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-teal-400">
                <Lock className="w-3.5 h-3.5" /> Pseudonymous Patient Ref Hash:
              </span>
              <span className="text-[10px] text-slate-500">SHA256 (Zero PII On-Chain)</span>
            </div>
            <div className="text-slate-300 text-[11px] truncate select-all">
              {patientRefHash}
            </div>
          </div>
        </div>

        {/* Card Mockup Visual */}
        <div className="glass-panel p-3 border-slate-800 flex flex-col items-center justify-center relative group overflow-hidden">
          <img
            src="/assets/bangladesh_health_card_mockup.jpg"
            alt="Bangladesh National Healthcare Interoperability Card Mockup"
            className="w-full h-auto rounded-xl object-cover border border-teal-500/30 shadow-lg shadow-teal-500/10 group-hover:scale-[1.02] transition-transform duration-300"
          />
          <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
            National Health Data Network • Mock Identity Token
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Consent Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grant Consent Form */}
          <div className="glass-panel p-6 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-5 h-5 text-teal-400" />
                <h2>Grant Granular Consent Token</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Tx: GrantConsent</span>
            </div>

            <form onSubmit={handleGrantConsent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Grantee / Healthcare Provider</label>
                  <select
                    value={grantee}
                    onChange={(e) => setGrantee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="DR_HASAN_CLINICIAN">Dr. Hasan Mahmud (Hospital A - Internal Med)</option>
                    <option value="DR_ALAM_EMERGENCY">Dr. Nusrat Alam (Hospital B - Emergency Dept)</option>
                    <option value="POPULAR_DIAGNOSTIC_LAB">Popular Diagnostic Centre (Lab Org2)</option>
                    <option value="Org1MSP">All Authorized Clinicians at Hospital A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Declared Processing Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="treatment">Clinical Direct Treatment (treatment)</option>
                    <option value="emergency">Emergency Pre-Authorization (emergency)</option>
                    <option value="audit">Quality Compliance Audit (audit)</option>
                  </select>
                </div>
              </div>

              {/* Granular Scopes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Granular FHIR Resource Scope (Data Minimization — No Wildcards)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${scopeAllergy ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeAllergy} onChange={(e) => setScopeAllergy(e.target.checked)} className="rounded text-teal-500" />
                    <span>AllergyIntolerance</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${scopeMedication ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeMedication} onChange={(e) => setScopeMedication(e.target.checked)} className="rounded text-teal-500" />
                    <span>MedicationRequest</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${scopeDiagnostic ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeDiagnostic} onChange={(e) => setScopeDiagnostic(e.target.checked)} className="rounded text-teal-500" />
                    <span>DiagnosticReport</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Validity:</label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="1">24 Hours (1 Day)</option>
                    <option value="7">7 Days (Standard)</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg gradient-teal text-slate-950 font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-teal-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Issue On-Chain Consent
                </button>
              </div>
            </form>
          </div>

          {/* Active Consents List */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Active Consent Grants ({consents.length})
              </h2>
              <button onClick={fetchData} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {consents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No active consent tokens registered for this patient reference. Use form above to issue consent.
              </div>
            ) : (
              <div className="space-y-3">
                {consents.map((c) => (
                  <div
                    key={c.consentId}
                    className={`p-4 rounded-xl border transition-all ${
                      c.revoked
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-teal-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">Grantee: {c.grantee}</span>
                          <span className={`badge-status ${c.revoked ? 'badge-revoked' : 'badge-granted'}`}>
                            {c.revoked ? 'REVOKED' : 'ACTIVE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Purpose: <strong className="text-slate-300">{c.purpose}</strong> • Expiry: <strong className="text-slate-300">{new Date(c.expiryTimestamp).toLocaleDateString()}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.scope.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-teal-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {!c.revoked && (
                        <button
                          onClick={() => handleRevokeConsent(c.consentId)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Immutable Audit Trail */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" />
                Immutable Access Audit Log
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Channel Ledger</span>
            </div>

            <p className="text-xs text-slate-400">
              Every data access request, emergency break-glass event, and consent modification is permanently anchored.
            </p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {auditTrail.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No access events logged yet.
                </div>
              ) : (
                auditTrail.map((ev, i) => (
                  <div key={i} className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`badge-status ${ev.status === 'GRANTED' || ev.status === 'GRANTED_BREAKGLASS' ? 'badge-granted' : 'badge-revoked'}`}>
                        {ev.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      Accessor: {ev.accessorHash?.substring(0, 12)}...
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Scope: <span className="text-teal-300">{ev.scope}</span> • Purpose: {ev.purpose}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
