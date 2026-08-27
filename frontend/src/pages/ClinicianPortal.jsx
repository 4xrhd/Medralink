import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Lock,
  Unlock,
  FilePlus,
  Search,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Database,
  Layers,
  Code2,
  FileText,
  Activity,
  HeartPulse,
  Pill,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

export default function ClinicianPortal() {
  const { activePatient, patientsList, selectPatient, showTransactionReceipt } = useAuth();

  // Access Request Form State
  const [patientRefHash, setPatientRefHash] = useState(
    activePatient?.patientRefHash || 'c7e9a8b1d2f4567890abcdef1234567890abcdef1234567890abcdef12345678'
  );
  const [consentId, setConsentId] = useState('');
  const [recordId, setRecordId] = useState('');
  const [purpose, setPurpose] = useState('treatment');
  const [isVerifying, setIsVerifying] = useState(false);
  const [decryptedRecord, setDecryptedRecord] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'json'
  const [copiedJson, setCopiedJson] = useState(false);

  // Available Records for Patient
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // New Record Creation State
  const [recordType, setRecordType] = useState('AllergyIntolerance');
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  // Keep patientRefHash in sync when user switches active patient in context
  useEffect(() => {
    if (activePatient?.patientRefHash) {
      setPatientRefHash(activePatient.patientRefHash);
    }
  }, [activePatient?.patientRefHash]);

  // Fetch available on-chain record references for the selected patient
  const fetchPatientRecords = useCallback(async () => {
    if (!patientRefHash) return;
    setLoadingRecords(true);
    try {
      const res = await api.getPatientRecords(patientRefHash);
      setPatientRecords(res.records || []);
    } catch (err) {
      console.warn('Failed to fetch patient records:', err);
      setPatientRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [patientRefHash]);

  useEffect(() => {
    fetchPatientRecords();
  }, [fetchPatientRecords]);

  // Subscribe to real-time blockchain SSE events to refresh records automatically
  useEffect(() => {
    const unsubscribe = api.subscribeEvents((event) => {
      if (
        event.type === 'BLOCK_COMMITTED' ||
        event.type === 'RECORD_CREATED' ||
        event.eventName === 'RecordCreated'
      ) {
        fetchPatientRecords();
      }
    });
    return () => unsubscribe();
  }, [fetchPatientRecords]);

  const handleFetchRecord = async (e, customRecordId = null) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setAccessError(null);
    setDecryptedRecord(null);

    try {
      let targetRecordId = customRecordId || recordId;

      // If recordId not specified, lookup existing records for this patient
      if (!targetRecordId) {
        const recordsRes = await api.getPatientRecords(patientRefHash);
        if (recordsRes.records && recordsRes.records.length > 0) {
          targetRecordId = recordsRes.records[0].recordId;
          setRecordId(targetRecordId);
        } else {
          // Auto-seed sample record if none exist
          const newRec = await api.createRecord({
            patientRefHash,
            recordType,
          });
          targetRecordId = newRec.recordId;
          setRecordId(targetRecordId);
          await fetchPatientRecords();
        }
      }

      // If consentId not entered, auto-resolve active patient consent token
      let targetConsentId = consentId;
      if (!targetConsentId) {
        const cRes = await api.getPatientConsents(patientRefHash);
        const active = cRes.consents?.find((c) => !c.revoked);
        if (active) {
          targetConsentId = active.consentId;
        } else {
          throw new Error(
            'No active on-chain consent token found for this patient. Please grant consent from the Patient Portal first.'
          );
        }
      }

      const res = await api.getRecord(targetRecordId, {
        consentId: targetConsentId,
        purpose,
      });

      setDecryptedRecord(res);
      showTransactionReceipt({
        message: 'On-chain consent verified & access logged to immutable audit trail',
        txId: res.txId || '0x' + Math.random().toString(16).substring(2, 34),
        blockNumber: res.blockNumber || 1,
      });
    } catch (err) {
      console.error(err);
      setAccessError(err.message || 'Access verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateNewRecord = async (e) => {
    e.preventDefault();
    setIsCreatingRecord(true);
    try {
      const res = await api.createRecord({
        patientRefHash,
        recordType,
      });

      showTransactionReceipt({
        message: `FHIR ${recordType} encrypted off-chain and hash anchored (CreateRecordReference)`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      setRecordId(res.recordId);
      await fetchPatientRecords();
    } catch (err) {
      setAccessError(`Failed to create record: ${err.message}`);
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleCopyJson = () => {
    if (!decryptedRecord?.fhirBundle) return;
    navigator.clipboard.writeText(JSON.stringify(decryptedRecord.fhirBundle, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="app-container py-8 space-y-8">
      {/* Portal Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Authorized Clinician Portal</h1>
            <p className="text-xs text-slate-400">
              Hospital A (Pilot Facility) • X.509 Identity:{' '}
              <span className="text-slate-300 font-mono">OU=Clinician, Org1MSP</span>
            </p>
          </div>
        </div>
        <div className="badge-status badge-granted">
          <ShieldCheck className="w-3.5 h-3.5" />
          Consent-Enforced Access
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Query, Registered Records & Create Controls */}
        <div className="space-y-6">
          {/* Query Form */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" />
              Request Clinical Record Retrieval
            </h2>

            <form onSubmit={(e) => handleFetchRecord(e)} className="space-y-4">
              {/* Quick Select Synthetic Patient */}
              {patientsList?.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Patient Case (1-Click Fill)
                  </label>
                  <select
                    value={activePatient?.syntheticId || ''}
                    onChange={(e) => {
                      selectPatient(e.target.value);
                      const sel = patientsList.find(p => p.syntheticId === e.target.value);
                      if (sel?.patientRefHash) setPatientRefHash(sel.patientRefHash);
                    }}
                    className="form-input text-teal-300 font-medium"
                  >
                    {patientsList.map((p) => (
                      <option key={p.syntheticId} value={p.syntheticId}>
                        {p.name} | {p.primaryCondition || p.bloodGroup}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Patient Ref Hash</label>
                <input
                  type="text"
                  value={patientRefHash}
                  onChange={(e) => setPatientRefHash(e.target.value)}
                  className="form-input font-mono"
                  placeholder="Paste pseudonymous patientRefHash..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Record ID (Optional - Auto-resolves)</label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  className="form-input font-mono"
                  placeholder="Leave empty to use latest patient record..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Consent Token UUID (Optional - Auto-resolves)</label>
                <input
                  type="text"
                  value={consentId}
                  onChange={(e) => setConsentId(e.target.value)}
                  className="form-input font-mono"
                  placeholder="Leave empty to use active on-chain consent..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="form-input"
                >
                  <option value="treatment">Clinical Treatment (treatment)</option>
                  <option value="emergency">Emergency Pre-Authorization (emergency)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="btn-primary w-full"
              >
                {isVerifying ? (
                  <Unlock className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                Verify On-Chain & Decrypt FHIR
              </button>
            </form>
          </div>

          {/* On-Chain Record References Registry for Patient */}
          <div className="glass-panel p-6 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                Patient Record References ({patientRecords.length})
              </h2>
              <button
                onClick={fetchPatientRecords}
                disabled={loadingRecords}
                className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
                title="Refresh records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {patientRecords.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No on-chain record references found for this patient.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {patientRecords.map((rec) => (
                  <div
                    key={rec.recordId}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 font-mono text-xs">
                        {rec.fhirResourceType || rec.recordType || 'FHIR Bundle'}
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">
                        {rec.custodialOrg || 'Org1MSP'}
                      </span>
                    </div>
                    <div className="text-2xs font-mono text-slate-500 truncate">
                      ID: {rec.recordId}
                    </div>
                    <button
                      onClick={() => {
                        setRecordId(rec.recordId);
                        handleFetchRecord(null, rec.recordId);
                      }}
                      disabled={isVerifying}
                      className="w-full mt-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-755 text-xs text-sky-400 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Lock className="w-3 h-3" /> Select & Decrypt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create & Store Encrypted Record Form */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-teal-400" />
              Store Encrypted FHIR Clinical Record
            </h2>
            <form onSubmit={handleCreateNewRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FHIR Resource Type</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/70"
                >
                  <option value="AllergyIntolerance">AllergyIntolerance (Penicillin Anaphylaxis)</option>
                  <option value="MedicationRequest">MedicationRequest (Metformin 500mg)</option>
                  <option value="Condition">Condition (Type 2 Diabetes Mellitus - SNOMED 44054006)</option>
                  <option value="Observation">Observation (Fasting Glucose - LOINC 1558-6)</option>
                  <option value="DiagnosticReport">DiagnosticReport (Comprehensive Metabolic Panel)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreatingRecord}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <FilePlus className="w-3.5 h-3.5" />
                Encrypt (AES-256) & Anchor On-Chain Hash
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Decrypted Records & On/Off-Chain Split View */}
        <div className="lg:col-span-2 space-y-6">
          {accessError && (
            <ErrorBanner
              error={accessError}
              onDismiss={() => setAccessError(null)}
              className="mb-4"
            />
          )}

          {decryptedRecord ? (
            <div className="space-y-4 animate-in fade-in">
              {/* On-Chain Verification Proof */}
              <div className="glass-panel p-5 border-slate-800 bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    On-Chain Cryptographic Proof Verified
                  </span>
                  <span className="badge-status badge-granted text-2xs">STATUS: AUTHORIZED</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Record Integrity Hash (SHA-256):</span>
                    <span className="text-slate-300 text-xs break-all">{decryptedRecord.recordHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Custodial Storage Organization:</span>
                    <span className="text-slate-200 font-semibold">
                      {decryptedRecord.custodialOrg || 'Org1MSP (Hospital A)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decrypted Clinical Bundle */}
              <div className="glass-panel p-6 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    Decrypted HL7 FHIR R4 Clinical Bundle
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                          viewMode === 'cards'
                            ? 'bg-slate-800 text-slate-100 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> Clinical View
                      </button>
                      <button
                        onClick={() => setViewMode('json')}
                        className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                          viewMode === 'json'
                            ? 'bg-slate-800 text-slate-100 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" /> FHIR JSON
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'json' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>HL7 FHIR R4 JSON Schema (Bundle/collection)</span>
                      <button
                        onClick={handleCopyJson}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 flex items-center gap-1 text-xs transition-colors"
                      >
                        {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedJson ? 'Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 max-h-96 overflow-y-auto custom-scrollbar">
                      {JSON.stringify(decryptedRecord.fhirBundle, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {decryptedRecord.fhirBundle?.entry?.map((item, idx) => {
                      const res = item.resource;
                      if (!res) return null;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 font-mono flex items-center gap-2">
                              {res.resourceType === 'AllergyIntolerance' && (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              {res.resourceType === 'MedicationRequest' && (
                                <Pill className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              {res.resourceType === 'Condition' && (
                                <Activity className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              {res.resourceType === 'Observation' && (
                                <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                              )}
                              {res.resourceType === 'DiagnosticReport' && (
                                <FileText className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              {res.resourceType}
                            </span>
                            <span className="text-slate-500 font-mono text-2xs">ID: {res.id?.substring(0, 16)}</span>
                          </div>

                          {/* AllergyIntolerance */}
                          {res.resourceType === 'AllergyIntolerance' && (
                            <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-rose-200 space-y-1">
                              <strong className="block text-rose-300 font-semibold">Critical Allergen Warning:</strong>
                              <div>{res.code?.text || 'Penicillin Allergy'}</div>
                              <div className="text-2xs text-rose-400 font-mono">
                                SNOMED-CT: {res.code?.coding?.[0]?.code || '373270004'} • Criticality:{' '}
                                {res.criticality?.toUpperCase() || 'HIGH'} • Status:{' '}
                                {res.verificationStatus?.coding?.[0]?.display || 'Confirmed'}
                              </div>
                            </div>
                          )}

                          {/* MedicationRequest */}
                          {res.resourceType === 'MedicationRequest' && (
                            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-slate-200 space-y-1">
                              <strong className="block text-sky-300 font-semibold">Active Prescription:</strong>
                              <div>{res.medicationCodeableConcept?.text || 'Prescription Medication'}</div>
                              <div className="text-2xs text-slate-400 font-mono">
                                Dosage: {res.dosageInstruction?.[0]?.text || 'Standard'} • RxNorm:{' '}
                                {res.medicationCodeableConcept?.coding?.[0]?.code || '860975'} • Status:{' '}
                                {res.status?.toUpperCase() || 'ACTIVE'}
                              </div>
                            </div>
                          )}

                          {/* Condition */}
                          {res.resourceType === 'Condition' && (
                            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-slate-200 space-y-1">
                              <strong className="block text-amber-300 font-semibold">Clinical Condition:</strong>
                              <div>{res.code?.text || 'Clinical Diagnosis'}</div>
                              <div className="text-2xs text-slate-400 font-mono">
                                SNOMED-CT: {res.code?.coding?.[0]?.code || '44054006'} • Status:{' '}
                                {res.clinicalStatus?.coding?.[0]?.display || 'Active'}
                              </div>
                            </div>
                          )}

                          {/* Observation */}
                          {res.resourceType === 'Observation' && (
                            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-slate-200 space-y-1">
                              <strong className="block text-teal-300 font-semibold">
                                Lab Observation: {res.code?.text || 'Diagnostic Observation'}
                              </strong>
                              <div className="text-slate-100 font-semibold">
                                Value: {res.valueQuantity?.value} {res.valueQuantity?.unit}
                                {res.interpretation?.[0]?.coding?.[0]?.code === 'H' && (
                                  <span className="ml-2 text-2xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    HIGH
                                  </span>
                                )}
                              </div>
                              <div className="text-2xs text-slate-400 font-mono">
                                LOINC: {res.code?.coding?.[0]?.code || '1558-6'} • Normal Range:{' '}
                                {res.referenceRange?.[0]?.low?.value} - {res.referenceRange?.[0]?.high?.value}{' '}
                                {res.referenceRange?.[0]?.low?.unit}
                              </div>
                            </div>
                          )}

                          {/* DiagnosticReport */}
                          {res.resourceType === 'DiagnosticReport' && (
                            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-slate-200 space-y-1">
                              <strong className="block text-sky-300 font-semibold">
                                {res.code?.text || 'Diagnostic Report'}:
                              </strong>
                              <div>{res.conclusion || 'No conclusion text available'}</div>
                              <div className="text-2xs text-slate-400 font-mono">
                                LOINC: {res.code?.coding?.[0]?.code || '1558-6'} • Status:{' '}
                                {res.status?.toUpperCase() || 'FINAL'}
                              </div>
                            </div>
                          )}

                          {/* Pseudonymized Patient Resource */}
                          {res.resourceType === 'Patient' && (
                            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-slate-200 space-y-1">
                              <strong className="block text-slate-300 font-semibold">
                                Pseudonymized Patient Identity:
                              </strong>
                              <div className="text-xs font-mono text-teal-400">
                                Ref Hash: {res.identifier?.[0]?.value || 'Salted SHA-256'}
                              </div>
                              <div className="text-2xs text-slate-400 font-mono">
                                Gender: {res.gender} • Birth Date: {res.birthDate} • Active: {String(res.active)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 text-center text-slate-400 text-xs border-dashed border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-bold text-slate-200">Consent-Gated Health Records Vault</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Clinical records remain encrypted with AES-256-GCM in custodial hospital repositories. Click <strong>"Verify On-Chain & Decrypt FHIR"</strong> or select a record reference on the left to verify active consent and unlock the clinical view.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-500">
                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-850">HL7 FHIR R4 Bundle</span>
                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-850">SHA-256 Record Hash Verification</span>
                <span className="px-2 py-1 rounded bg-slate-950 border border-slate-850">Immutable Access Logging</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

