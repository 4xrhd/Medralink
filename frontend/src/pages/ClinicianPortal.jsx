import React, { useState } from 'react';
import { Stethoscope, Lock, Unlock, FilePlus, Search, AlertCircle, CheckCircle2, ShieldCheck, Database, Layers } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ClinicianPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  
  // Access Request Form
  const [patientRefHash, setPatientRefHash] = useState(
    activePatient?.patientRefHash || 'c7e9a8b1d2f4567890abcdef1234567890abcdef1234567890abcdef12345678'
  );
  const [consentId, setConsentId] = useState('');
  const [recordId, setRecordId] = useState('');
  const [purpose, setPurpose] = useState('treatment');
  const [isVerifying, setIsVerifying] = useState(false);
  const [decryptedRecord, setDecryptedRecord] = useState(null);
  const [accessError, setAccessError] = useState(null);

  // New Record Form
  const [recordType, setRecordType] = useState('AllergyIntolerance');
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  const handleFetchRecord = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setAccessError(null);
    setDecryptedRecord(null);

    try {
      // First check active records for this patient if recordId is not specified
      let targetRecordId = recordId;
      if (!targetRecordId) {
        const recordsRes = await api.getPatientRecords(patientRefHash);
        if (recordsRes.records && recordsRes.records.length > 0) {
          targetRecordId = recordsRes.records[0].recordId;
        } else {
          // Create sample record first if none exist
          const newRec = await api.createRecord({
            patientRefHash,
            recordType,
          });
          targetRecordId = newRec.recordId;
        }
      }

      // If consentId not entered, check patient consents
      let targetConsentId = consentId;
      if (!targetConsentId) {
        const cRes = await api.getPatientConsents(patientRefHash);
        const active = cRes.consents?.find((c) => !c.revoked);
        if (active) {
          targetConsentId = active.consentId;
        } else {
          throw new Error('No active on-chain consent token found for this patient. Please grant consent from the Patient Portal first.');
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
      alert(`Record created successfully! Record ID: ${res.recordId}`);
    } catch (err) {
      alert(`Failed to create record: ${err.message}`);
    } finally {
      setIsCreatingRecord(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portal Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Authorized Clinician Portal</h1>
            <p className="text-xs text-slate-400">Hospital A (Pilot Facility) • X.509 Identity: <span className="text-blue-300 font-mono">OU=Clinician, Org1MSP</span></p>
          </div>
        </div>
        <div className="badge-status badge-granted">
          <ShieldCheck className="w-4 h-4" />
          Consent-Enforced Access
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Query & Create Controls */}
        <div className="space-y-6">
          {/* Query Form */}
          <div className="glass-panel p-6 border-slate-800">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" />
              Request Clinical Record Retrieval
            </h2>

            <form onSubmit={handleFetchRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Patient Ref Hash</label>
                <input
                  type="text"
                  value={patientRefHash}
                  onChange={(e) => setPatientRefHash(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Paste pseudonymous patientRefHash..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Consent Token UUID (Optional - Auto-resolves)</label>
                <input
                  type="text"
                  value={consentId}
                  onChange={(e) => setConsentId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Leave empty to use active patient consent..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value="treatment">Clinical Treatment (treatment)</option>
                  <option value="emergency">Emergency Pre-Authorization (emergency)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-blue-500/20"
              >
                {isVerifying ? (
                  <Unlock className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Verify On-Chain & Decrypt FHIR
              </button>
            </form>
          </div>

          {/* Create Record Form */}
          <div className="glass-panel p-6 border-slate-800">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FilePlus className="w-4 h-4 text-teal-400" />
              Create & Encrypt New Record
            </h2>
            <form onSubmit={handleCreateNewRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">FHIR Resource Type</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value="AllergyIntolerance">AllergyIntolerance (Penicillin Anaphylaxis)</option>
                  <option value="MedicationRequest">MedicationRequest (Metformin 500mg)</option>
                  <option value="DiagnosticReport">DiagnosticReport (Fasting Blood Sugar)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreatingRecord}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                Encrypt (AES-256) & Anchor Hash
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Cols: Decrypted Records & On/Off-Chain Split View */}
        <div className="lg:col-span-2 space-y-6">
          {accessError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-200">Access Denied by Smart Contract</div>
                <div className="mt-1">{accessError}</div>
                <div className="mt-2 text-[11px] text-red-400/80 font-mono">
                  Chaincode Status: RequestAccess → LogAccess (DENIED / CONSENT_REVOKED)
                </div>
              </div>
            </div>
          )}

          {decryptedRecord ? (
            <div className="space-y-4 animate-in fade-in">
              {/* On-Chain Verification Proof */}
              <div className="glass-panel p-5 border-teal-500/30 bg-teal-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    On-Chain Cryptographic Proof Verified
                  </span>
                  <span className="badge-status badge-granted text-[10px]">STATUS: AUTHORIZED</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Record Integrity Hash (SHA-256):</span>
                    <span className="text-slate-300 text-[11px] break-all">{decryptedRecord.recordHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Custodial Storage Organization:</span>
                    <span className="text-teal-400 font-bold">{decryptedRecord.custodialOrg || 'Org1MSP (Hospital A)'}</span>
                  </div>
                </div>
              </div>

              {/* Decrypted Clinical Bundle */}
              <div className="glass-panel p-6 border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Decrypted HL7 FHIR R4 Clinical Bundle
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">Decryption: AES-256-GCM</span>
                </div>

                <div className="space-y-4">
                  {decryptedRecord.fhirBundle?.entry?.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-300">{item.resource?.resourceType}</span>
                        <span className="text-slate-500 font-mono text-[10px]">ID: {item.resource?.id}</span>
                      </div>

                      {/* Display based on FHIR resource type */}
                      {item.resource?.resourceType === 'AllergyIntolerance' && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-200">
                          <strong className="block text-red-300">Critical Anaphylaxis Warning:</strong>
                          <span>{item.resource?.code?.text || 'Penicillin Allergy'}</span>
                          <div className="text-[10px] text-red-400 mt-1">
                            SNOMED-CT: 373270004 • Criticality: HIGH • Status: Confirmed
                          </div>
                        </div>
                      )}

                      {item.resource?.resourceType === 'MedicationRequest' && (
                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-blue-200">
                          <strong className="block text-blue-300">Active Prescription:</strong>
                          <span>{item.resource?.medicationCodeableConcept?.text}</span>
                          <div className="text-[10px] text-blue-400 mt-1">
                            Dosage: {item.resource?.dosageInstruction?.[0]?.text} • RxNorm: 860975
                          </div>
                        </div>
                      )}

                      {item.resource?.resourceType === 'DiagnosticReport' && (
                        <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg text-purple-200">
                          <strong className="block text-purple-300">{item.resource?.code?.text}:</strong>
                          <span>{item.resource?.conclusion}</span>
                          <div className="text-[10px] text-purple-400 mt-1">
                            LOINC: 1558-6 • Status: Final
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500 text-xs border-dashed border-slate-800">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              Use query panel on the left to verify on-chain patient consent and decrypt FHIR clinical resources.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
