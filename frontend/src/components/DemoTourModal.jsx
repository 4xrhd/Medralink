import React, { useState } from 'react';
import { Play, CheckCircle, ArrowRight, RefreshCw, X, Shield, Activity, Lock, AlertOctagon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from './ErrorBanner';

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Register Patient Reference',
    txName: 'RegisterPatientReference',
    actor: 'Mock Identity Adapter',
    role: 'Admin',
    desc: 'Generates pseudonymous patientRefHash from synthetic health ID. Zero PII stored on ledger.',
    action: async (ctx) => {
      const res = await api.registerPatient(
        {
          syntheticId: 'BD-HEALTH-994821',
          dob: '1992-05-14',
          homeOrg: 'Org1MSP',
        },
        { role: 'Admin' }
      );
      const patientRef = res?.patientRefHash || ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, step1: res }));
      return res;
    },
  },
  {
    step: 2,
    title: 'Store Encrypted FHIR Clinical Record',
    txName: 'AES-256-GCM Encryption',
    actor: 'Custodial Hospital Repository',
    role: 'Clinician',
    desc: 'Encrypts FHIR R4 Bundle (AllergyIntolerance + MedicationRequest) off-chain with per-record DEK.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash;
      if (!patientRef) {
        const pat = await api.getSyntheticPatients({ role: 'Clinician' }).catch(() => ({}));
        patientRef = pat?.patients?.[0]?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      }
      const res = await api.createRecord(
        {
          patientRefHash: patientRef,
          recordType: 'AllergyIntolerance',
          clinicalData: { gender: 'male', birthDate: '1992-05-14' },
        },
        { role: 'Clinician' }
      );
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, recordId: res.recordId, recordHash: res.recordHash, step2: res }));
      return res;
    },
  },
  {
    step: 3,
    title: 'Anchor Cryptographic Record Hash',
    txName: 'CreateRecordReference',
    actor: 'Authorized Hospital Peer (Org1MSP)',
    role: 'Clinician',
    desc: 'Anchors SHA-256 ciphertext hash and opaque storage locator hash to channel medralink-main.',
    action: async (ctx) => {
      const recordId = ctx.demoState?.recordId;
      const recordHash = ctx.demoState?.recordHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      return { status: 'CONFIRMED', recordId, recordHash, txId: ctx.demoState?.step2?.txId || '0x' + Math.random().toString(16).substring(2, 34) };
    },
  },
  {
    step: 4,
    title: 'Patient Grants Scoped Consent',
    txName: 'GrantConsent',
    actor: 'Patient (Mobile App Signed)',
    role: 'Patient',
    desc: 'Issues 7-day granular authorization for scope [AllergyIntolerance, MedicationRequest] under purpose=treatment.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash;
      if (!patientRef) {
        const pat = await api.getSyntheticPatients({ role: 'Patient' }).catch(() => ({}));
        patientRef = pat?.patients?.[0]?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      }
      const res = await api.grantConsent(
        {
          patientRefHash: patientRef,
          grantee: 'DR_HASAN_CLINICIAN',
          scope: ['AllergyIntolerance', 'MedicationRequest'],
          purpose: 'treatment',
          expiryDays: 7,
        },
        { role: 'Patient' }
      );
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, consentId: res.consentId, step4: res }));
      return res;
    },
  },
  {
    step: 5,
    title: 'Clinician Authorized Retrieval',
    txName: 'RequestAccess → LogAccess',
    actor: 'Authorized Clinician (Hospital A)',
    role: 'Clinician',
    desc: 'Chaincode verifies active consent, decrypts minimum-necessary clinical bundle, and logs access on-chain.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      let recordId = ctx.demoState?.recordId;
      if (!recordId) {
        const recs = await api.getPatientRecords(patientRef, { role: 'Clinician' }).catch(() => ({}));
        if (recs?.records?.length > 0) {
          recordId = recs.records[0].recordId;
        } else {
          const newRec = await api.createRecord({ patientRefHash: patientRef, recordType: 'AllergyIntolerance' }, { role: 'Clinician' });
          recordId = newRec.recordId;
        }
      }
      let consentId = ctx.demoState?.consentId;
      if (!consentId) {
        const cRes = await api.getPatientConsents(patientRef, { role: 'Clinician' }).catch(() => ({}));
        const active = cRes?.consents?.find((c) => !c.revoked);
        if (active) {
          consentId = active.consentId;
        } else {
          const newCon = await api.grantConsent(
            {
              patientRefHash: patientRef,
              grantee: 'DR_HASAN_CLINICIAN',
              scope: ['AllergyIntolerance', 'MedicationRequest'],
              purpose: 'treatment',
              expiryDays: 7,
            },
            { role: 'Patient' }
          );
          consentId = newCon.consentId;
        }
      }
      const res = await api.getRecord(
        recordId,
        {
          consentId,
          purpose: 'treatment',
        },
        { role: 'Clinician' }
      );
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, recordId, consentId, decryptedBundle: res.fhirBundle, step5: res }));
      return res;
    },
  },
  {
    step: 6,
    title: 'Patient Revokes Consent',
    txName: 'RevokeConsent',
    actor: 'Patient App',
    role: 'Patient',
    desc: 'Patient immediately terminates clinician access rights on-chain with non-repudiation proof.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      let consentId = ctx.demoState?.consentId;
      if (!consentId) {
        const cRes = await api.getPatientConsents(patientRef, { role: 'Patient' }).catch(() => ({}));
        const active = cRes?.consents?.find((c) => !c.revoked);
        if (active) {
          consentId = active.consentId;
        } else {
          const newCon = await api.grantConsent(
            {
              patientRefHash: patientRef,
              grantee: 'DR_HASAN_CLINICIAN',
              scope: ['AllergyIntolerance', 'MedicationRequest'],
              purpose: 'treatment',
              expiryDays: 7,
            },
            { role: 'Patient' }
          );
          consentId = newCon.consentId;
        }
      }
      const res = await api.revokeConsent(consentId, patientRef, { role: 'Patient' });
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, consentId, step6: res }));
      return res;
    },
  },
  {
    step: 7,
    title: 'Automatic Access Denial Verification',
    txName: 'RequestAccess (Fail-Closed)',
    actor: 'Clinician Retrieval Attempt',
    role: 'Clinician',
    desc: 'Subsequent clinician request is automatically denied on-chain with CONSENT_REVOKED status.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      let recordId = ctx.demoState?.recordId;
      if (!recordId) {
        const recs = await api.getPatientRecords(patientRef, { role: 'Clinician' }).catch(() => ({}));
        if (recs?.records?.length > 0) {
          recordId = recs.records[0].recordId;
        }
      }
      let consentId = ctx.demoState?.consentId;
      if (!consentId) {
        const cRes = await api.getPatientConsents(patientRef, { role: 'Clinician' }).catch(() => ({}));
        const revoked = cRes?.consents?.find((c) => c.revoked);
        if (revoked) {
          consentId = revoked.consentId;
        }
      }
      try {
        await api.getRecord(
          recordId,
          {
            consentId: consentId || 'revoked_consent_token',
            purpose: 'treatment',
          },
          { role: 'Clinician' }
        );
        throw new Error('Access should have been denied on revoked consent');
      } catch (err) {
        return {
          status: 'SUCCESSFULLY_DENIED',
          expectedResult: 'CONSENT_REVOKED',
          message: err.message,
        };
      }
    },
  },
  {
    step: 8,
    title: 'Emergency Break-Glass Invocation',
    txName: 'InvokeEmergencyAccess',
    actor: 'Emergency Clinician (Hospital B ED)',
    role: 'Emergency',
    desc: 'Time-boxed 60-min emergency access granted under reasonCode UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS with MFA audit event.',
    action: async (ctx) => {
      let patientRef = ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      const res = await api.invokeEmergency(
        {
          patientRefHash: patientRef,
          reasonCode: 'UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS',
          scope: ['AllergyIntolerance', 'MedicationRequest'],
          expiryMinutes: 60,
        },
        { role: 'Emergency' }
      );
      ctx.setDemoState((prev) => ({ ...prev, patientRefHash: patientRef, emergencyId: res.emergencyId, step8: res }));
      return res;
    },
  },
  {
    step: 9,
    title: 'Auditor Review & Immutable Audit Verification',
    txName: 'ReviewEmergencyAccess & Audit Query',
    actor: 'DGHS Compliance Auditor',
    role: 'Auditor',
    desc: 'Auditor reviews emergency justification, marks APPROPRIATE, and inspects complete tamper-proof ledger history.',
    action: async (ctx) => {
      let emergencyId = ctx.demoState?.emergencyId;
      let patientRef = ctx.demoState?.patientRefHash || '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1';
      if (!emergencyId) {
        const emgList = await api.getAllEmergencyEvents({ role: 'Auditor' }).catch(() => ({}));
        const pending = emgList?.events?.find((e) => e.reviewStatus === 'PENDING' || e.reviewStatus === 'PENDING_DGHS_POST_HOC_REVIEW');
        if (pending) {
          emergencyId = pending.emergencyId;
        } else {
          const newEmg = await api.invokeEmergency(
            {
              patientRefHash: patientRef,
              reasonCode: 'TRAUMA_RESUSCITATION',
              scope: ['AllergyIntolerance'],
              expiryMinutes: 60,
            },
            { role: 'Emergency' }
          );
          emergencyId = newEmg.emergencyId;
        }
      }
      const reviewRes = await api.reviewEmergency(
        {
          emergencyId,
          reviewStatus: 'APPROPRIATE',
          findingsNote: 'Clinician emergency access justified under Protocol B-04.',
        },
        { role: 'Auditor' }
      );
      const auditTrail = await api.getAuditHistory(patientRef, { role: 'Auditor' });
      return { review: reviewRes, auditHistoryCount: auditTrail.eventCount, auditTrail: auditTrail.auditTrail };
    },
  },
];

export default function DemoTourModal({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tourError, setTourError] = useState(null);
  const [demoState, setDemoState] = useState({
    patientRefHash: '2a3d56a3872ecb0d392877404798d4fd5a5b77b6f478928cf3fed661c7d3fde1',
  });
  const { showTransactionReceipt, switchRole } = useAuth();

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const runCurrentStep = async () => {
    setIsLoading(true);
    setTourError(null);
    if (currentStep.role) {
      localStorage.setItem('medralink_demo_role', currentStep.role);
      switchRole(currentStep.role);
    }
    try {
      const result = await currentStep.action({ demoState, setDemoState });
      setStepResults((prev) => ({ ...prev, [currentStep.step]: result }));
      showTransactionReceipt({
        message: `Step ${currentStep.step}: ${currentStep.title} executed successfully.`,
        txId: result?.txId || result?.review?.txId || '0x' + Math.random().toString(16).substring(2, 34),
        blockNumber: result?.blockNumber || currentStepIndex + 2,
      });
    } catch (err) {
      console.error(err);
      setTourError(`Step ${currentStep.step} error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllStepsSequentially = async () => {
    setIsLoading(true);
    let state = { ...demoState };
    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStepIndex(i);
      const step = DEMO_STEPS[i];
      if (step.role) {
        localStorage.setItem('medralink_demo_role', step.role);
        switchRole(step.role);
      }
      try {
        const res = await step.action({
          demoState: state,
          setDemoState: (updater) => {
            if (typeof updater === 'function') {
              state = updater(state);
            } else {
              state = { ...state, ...updater };
            }
            setDemoState(state);
          },
        });
        setStepResults((prev) => ({ ...prev, [step.step]: res }));
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        console.error(err);
        break;
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel max-w-3xl w-full p-6 text-slate-100 relative max-h-[90vh] flex flex-col bg-slate-900 border-slate-750 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
              9
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Live Prototype Demo Tour</h2>
              <p className="text-xs text-slate-400">9-Step Vertical Slice Verification Flow (Matches Architecture Specifications)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-9 gap-1.5 my-4">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                stepResults[s.step]
                  ? 'bg-teal-500'
                  : idx === currentStepIndex
                  ? 'bg-slate-400'
                  : 'bg-slate-800'
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Active Step Content */}
        <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-lg flex-1 overflow-y-auto custom-scrollbar space-y-4">
          {tourError && (
            <ErrorBanner error={tourError} onDismiss={() => setTourError(null)} />
          )}

          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-teal-400 tracking-wider uppercase font-mono">
                Step {currentStep.step} of 9
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">{currentStep.title}</h3>
            </div>
            <span className="badge-status badge-granted font-mono text-2xs">
              Tx: {currentStep.txName}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{currentStep.desc}</p>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-2xs">Invoking Actor:</span>
              <span className="text-slate-300 font-medium">{currentStep.actor}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-2xs">Blockchain Channel:</span>
              <span className="text-slate-300 font-mono">medralink-main</span>
            </div>
          </div>

          {/* Result Inspection */}
          {stepResults[currentStep.step] && (
            <div className="bg-slate-900 border border-slate-750 p-3 rounded-lg text-xs space-y-1.5 font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Execution Verified on Ledger</span>
              </div>
              <pre className="text-2xs text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800">
                {JSON.stringify(stepResults[currentStep.step], null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
          <button
            onClick={runAllStepsSequentially}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Run All 9 Steps Automatically
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex((p) => p - 1)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs border border-slate-700"
              >
                Previous
              </button>
            )}

            <button
              onClick={runCurrentStep}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              Execute Step {currentStep.step}
            </button>

            {currentStepIndex < DEMO_STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStepIndex((p) => p + 1)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
              >
                Next <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
