import React, { useState, useEffect } from 'react';
import { Shield, Lock, Trash2, Plus, Clock, FileText, CheckCircle, AlertCircle, History, RefreshCw, Eye, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  const [consents, setConsents] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Decrypted Record Viewer State
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [viewingError, setViewingError] = useState(null);

  // Grant Consent Form State
  const [grantee, setGrantee] = useState('DR_HASAN_CLINICIAN');
  const [scopeAllergy, setScopeAllergy] = useState(true);
  const [scopeMedication, setScopeMedication] = useState(true);
  const [scopeCondition, setScopeCondition] = useState(false);
  const [scopeObservation, setScopeObservation] = useState(false);
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
    const unsubscribe = api.subscribeEvents(() => {
      fetchData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [patientRefHash]);

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const scope = [];
      if (scopeAllergy) scope.push('AllergyIntolerance');
      if (scopeMedication) scope.push('MedicationRequest');
      if (scopeCondition) scope.push('Condition');
      if (scopeObservation) scope.push('Observation');
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

  const handleViewRecord = async (recordId) => {
    setViewingLoading(true);
    setViewingError(null);
    try {
      const res = await api.getRecord(recordId, {}, { role: 'Patient' });
      setViewingRecord(res);
    } catch (err) {
      setViewingError(err.message);
    } finally {
      setViewingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Profile & Bangladesh Smart Health Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 border-slate-800 flex flex-col justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-lg">
              {activePatient?.name?.substring(0, 2) || 'RC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">{activePatient?.name || 'Rahim Chowdhury (Synthetic)'}</h1>
                <span className="badge-status badge-granted text-[10px]">Identity Verified (Mock Adapter)</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                <span>Synthetic ID: <strong className="text-slate-300">{activePatient?.syntheticId || 'BD-HEALTH-994821'}</strong></span>
                <span>•</span>
                <span>Home Org: <strong className="text-slate-300">{activePatient?.homeOrg || 'Org1MSP (Hospital A)'}</strong></span>
                <span>•</span>
                <span>Blood: <strong className="text-slate-300">{activePatient?.bloodGroup || 'B+'}</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs font-mono w-full">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-teal-400" /> Pseudonymous Patient Ref Hash:
              </span>
              <span className="text-[10px] text-slate-500">SHA256 (Zero PII On-Chain)</span>
            </div>
            <div className="text-slate-400 text-[11px] truncate select-all">
              {patientRefHash}
            </div>
          </div>
        </div>

        {/* Card Mockup Visual */}
        <div className="glass-panel p-3 border-slate-800 flex flex-col items-center justify-center relative group overflow-hidden">
          <img
            src="/assets/bangladesh_health_card_mockup.jpg"
            alt="Bangladesh National Healthcare Interoperability Card Mockup"
            className="w-full h-auto rounded-lg object-cover border border-slate-800 shadow-sm"
          />
          <div className="mt-2 text-[10px] text-slate-500 text-center font-mono">
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
              <div className="flex items-center gap-2 text-slate-100 font-bold">
                <Shield className="w-4 h-4 text-teal-400" />
                <h2 className="text-base">Grant Granular Consent Token</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Tx: GrantConsent</span>
            </div>

            <form onSubmit={handleGrantConsent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Grantee / Healthcare Provider</label>
                  <select
                    value={grantee}
                    onChange={(e) => setGrantee(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
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
                    className="w-full bg-slate-950/70 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${scopeAllergy ? 'bg-slate-850 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeAllergy} onChange={(e) => setScopeAllergy(e.target.checked)} className="rounded text-teal-600 bg-slate-900 border-slate-700" />
                    <span className="font-mono text-[11px]">Allergy</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${scopeMedication ? 'bg-slate-850 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeMedication} onChange={(e) => setScopeMedication(e.target.checked)} className="rounded text-teal-600 bg-slate-900 border-slate-700" />
                    <span className="font-mono text-[11px]">Medication</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${scopeCondition ? 'bg-slate-850 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeCondition} onChange={(e) => setScopeCondition(e.target.checked)} className="rounded text-teal-600 bg-slate-900 border-slate-700" />
                    <span className="font-mono text-[11px]">Condition</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${scopeObservation ? 'bg-slate-850 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeObservation} onChange={(e) => setScopeObservation(e.target.checked)} className="rounded text-teal-600 bg-slate-900 border-slate-700" />
                    <span className="font-mono text-[11px]">Observation</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${scopeDiagnostic ? 'bg-slate-850 border-teal-500/40 text-teal-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}>
                    <input type="checkbox" checked={scopeDiagnostic} onChange={(e) => setScopeDiagnostic(e.target.checked)} className="rounded text-teal-600 bg-slate-900 border-slate-700" />
                    <span className="font-mono text-[11px]">Diagnostic</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Validity:</label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="bg-slate-950/70 border border-slate-750 rounded px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="1">24 Hours (1 Day)</option>
                    <option value="7">7 Days (Standard)</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue On-Chain Consent
                </button>
              </div>
            </form>
          </div>

          {/* Active Consents List */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Active Consent Grants ({consents.length})
              </h2>
              <button onClick={fetchData} className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {consents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No active consent tokens registered for this patient reference. Use form above to issue consent.
              </div>
            ) : (
              <div className="space-y-3">
                {consents.map((c) => (
                  <div
                    key={c.consentId}
                    className={`p-4 rounded-lg border transition-all ${
                      c.revoked
                        ? 'bg-slate-950/40 border-slate-800 opacity-60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200">Grantee: {c.grantee}</span>
                          <span className={`badge-status ${c.revoked ? 'badge-revoked' : 'badge-granted'}`}>
                            {c.revoked ? 'REVOKED' : 'ACTIVE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Purpose: <strong className="text-slate-300">{c.purpose}</strong> • Expiry: <strong className="text-slate-300">{new Date(c.expiryTimestamp).toLocaleDateString()}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.scope.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {!c.revoked && (
                        <button
                          onClick={() => handleRevokeConsent(c.consentId)}
                          className="px-2.5 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 transition-colors font-medium"
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

          {/* Encrypted Health Vault Records */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                Custodial Encrypted Health Records ({records.length})
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Off-Chain AES-256-GCM</span>
            </div>

            <p className="text-xs text-slate-400">
              Encrypted clinical payloads stored in custodial hospital repositories. Only cryptographic integrity hashes are anchored on-chain.
            </p>

            {records.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No encrypted clinical records currently deposited for this patient reference.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {records.map((r) => (
                  <div
                    key={r.recordId}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 font-mono">
                          {r.fhirResourceType || r.recordType || 'FHIR Bundle'}
                        </span>
                        <span className="badge-status badge-granted text-[9px]">
                          {r.custodialOrg || 'Org1MSP'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        Record ID: {r.recordId}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        Hash: {r.recordHash ? `${r.recordHash.substring(0, 20)}...` : 'Anchored SHA-256'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewRecord(r.recordId)}
                      disabled={viewingLoading}
                      className="w-full mt-2 py-1 px-2.5 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                      {viewingLoading ? 'Decrypting...' : 'View Decrypted FHIR'}
                    </button>
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
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" />
                Immutable Access Audit Log
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Channel Ledger</span>
            </div>

            <p className="text-xs text-slate-400">
              Every data access request, emergency break-glass event, and consent modification is permanently anchored.
            </p>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {auditTrail.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No access events logged yet.
                </div>
              ) : (
                auditTrail.map((ev, i) => (
                  <div key={i} className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`badge-status ${ev.status === 'GRANTED' || ev.status === 'GRANTED_BREAKGLASS' || ev.status === 'GRANTED_PATIENT_OWNER' ? 'badge-granted' : 'badge-revoked'}`}>
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
                      Scope: <span className="text-slate-200 font-mono">{ev.scope}</span> • Purpose: {ev.purpose}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decrypted Record View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border-slate-700 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Decrypted Patient Health Record</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Record ID: {viewingRecord.recordId}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap gap-4 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500">Record Hash: </span>
                  <span className="text-teal-400">{viewingRecord.recordHash?.substring(0, 24)}...</span>
                </div>
                <div>
                  <span className="text-slate-500">Custodial Org: </span>
                  <span className="text-slate-300">{viewingRecord.custodialOrg}</span>
                </div>
                <div>
                  <span className="text-slate-500">Decryption Status: </span>
                  <span className="text-emerald-400">AUTHORIZED (Owner Provenance)</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-2 text-xs">FHIR R4 Bundle Resources:</h4>
                <div className="space-y-2">
                  {viewingRecord.fhirBundle?.entry?.map((entry, idx) => {
                    const res = entry.resource;
                    return (
                      <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-300 font-mono">{res?.resourceType}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {res?.id}</span>
                        </div>
                        {res?.resourceType === 'AllergyIntolerance' && (
                          <div className="text-slate-300">
                            <strong>Substance: </strong>{res?.code?.coding?.[0]?.display || 'Penicillin'} ({res?.code?.coding?.[0]?.code}) — <span className="text-rose-400 font-semibold">{res?.criticality?.toUpperCase()} CRITICALITY</span>
                          </div>
                        )}
                        {res?.resourceType === 'MedicationRequest' && (
                          <div className="text-slate-300">
                            <strong>Medication: </strong>{res?.medicationCodeableConcept?.coding?.[0]?.display || 'Metformin 500mg'} ({res?.medicationCodeableConcept?.coding?.[0]?.code})
                          </div>
                        )}
                        {res?.resourceType === 'Observation' && (
                          <div className="text-slate-300">
                            <strong>Observation: </strong>{res?.code?.coding?.[0]?.display} = {res?.valueQuantity ? `${res.valueQuantity.value} ${res.valueQuantity.unit}` : 'Standard'}
                          </div>
                        )}
                        {res?.resourceType === 'Condition' && (
                          <div className="text-slate-300">
                            <strong>Condition: </strong>{res?.code?.coding?.[0]?.display} ({res?.clinicalStatus?.coding?.[0]?.code})
                          </div>
                        )}
                        {res?.resourceType === 'DiagnosticReport' && (
                          <div className="text-slate-300">
                            <strong>Diagnostic Report: </strong>{res?.code?.coding?.[0]?.display || 'Panel'} — Status: {res?.status}
                          </div>
                        )}
                        {res?.resourceType === 'Patient' && (
                          <div className="text-slate-300">
                            <strong>Synthetic Identity Reference: </strong>{res?.id} (Gender: {res?.gender})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <details className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px]">
                  <summary className="font-mono text-slate-400 cursor-pointer hover:text-slate-300">
                    View Raw Decrypted HL7 FHIR R4 JSON
                  </summary>
                  <pre className="mt-2 text-slate-300 font-mono text-[10px] overflow-x-auto p-2 bg-slate-900/90 rounded custom-scrollbar max-h-60">
                    {JSON.stringify(viewingRecord.fhirBundle, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
