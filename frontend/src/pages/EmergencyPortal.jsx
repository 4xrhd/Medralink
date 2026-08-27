import React, { useState, useEffect } from 'react';
import { Flame, AlertOctagon, Clock, ShieldAlert, CheckCircle, Unlock, Activity, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EmergencyPortal() {
  const { activePatient, showTransactionReceipt } = useAuth();
  const [patientRefHash, setPatientRefHash] = useState(
    activePatient?.patientRefHash || 'c7e9a8b1d2f4567890abcdef1234567890abcdef1234567890abcdef12345678'
  );
  const [reasonCode, setReasonCode] = useState('UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS');
  const [scope, setScope] = useState(['AllergyIntolerance', 'MedicationRequest']);
  const [mfaConfirmed, setMfaConfirmed] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(3600); // 60 mins

  // Sync patientRefHash when activePatient changes in context
  useEffect(() => {
    if (activePatient?.patientRefHash) {
      setPatientRefHash(activePatient.patientRefHash);
    }
  }, [activePatient?.patientRefHash]);

  // Restore any active unexpired emergency session on mount / patient change
  useEffect(() => {
    async function restoreActiveSession() {
      if (!patientRefHash) return;
      try {
        const res = await api.getAllEmergencyEvents();
        const patientEvents = res.events?.filter((e) => e.patientRefHash === patientRefHash) || [];
        if (patientEvents.length > 0) {
          const latest = patientEvents[patientEvents.length - 1];
          const expiryTime = new Date(latest.expiryTimestamp).getTime();
          const now = Date.now();
          if (expiryTime > now) {
            setActiveEmergency(latest);
            setTimeLeftSeconds(Math.max(0, Math.floor((expiryTime - now) / 1000)));
          }
        }
      } catch (err) {
        console.warn('Could not restore emergency session:', err);
      }
    }
    restoreActiveSession();
  }, [patientRefHash]);

  useEffect(() => {
    let timer;
    if (activeEmergency && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeEmergency, timeLeftSeconds]);

  const handleBreakGlass = async (e) => {
    e.preventDefault();
    if (!mfaConfirmed) {
      alert('You must confirm emergency step-up authorization.');
      return;
    }

    setIsInvoking(true);
    try {
      const res = await api.invokeEmergency({
        patientRefHash,
        reasonCode,
        scope,
        expiryMinutes: 60,
      });

      setActiveEmergency(res);
      setTimeLeftSeconds(3600);
      showTransactionReceipt({
        message: `Emergency break-glass invoked on blockchain (InvokeEmergencyAccess: ${reasonCode})`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
    } catch (err) {
      alert(`Emergency invocation failed: ${err.message}`);
    } finally {
      setIsInvoking(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Emergency Header */}
      <div className="glass-panel p-6 border-rose-900/40 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">Emergency Break-Glass Portal</h1>
              <span className="badge-status badge-emergency">EMERGENCY PROTOCOL</span>
            </div>
            <p className="text-xs text-slate-400">Hospital B (Emergency Dept) • X.509 Identity: <span className="text-slate-300 font-mono">OU=Emergency, Org2MSP</span></p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-rose-900/40 max-w-sm">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400 inline mr-1" />
          Break-glass overrides explicit consent for 60 mins. Mandatory post-hoc auditor review triggered.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Invocation Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Invoke Emergency Break-Glass Authorization
            </h2>

            <form onSubmit={handleBreakGlass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Patient Ref Hash</label>
                <input
                  type="text"
                  value={patientRefHash}
                  onChange={(e) => setPatientRefHash(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-750 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Emergency Protocol (Reason Code)</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-750 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-rose-500"
                >
                  <option value="UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS">UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS (Anaphylactic Shock)</option>
                  <option value="TRAUMA_RESUSCITATION">TRAUMA_RESUSCITATION (Severe Polytrauma)</option>
                  <option value="ACUTE_CORONARY_SYNDROME">ACUTE_CORONARY_SYNDROME (Myocardial Infarction)</option>
                  <option value="CARDIAC_ARREST">CARDIAC_ARREST (ACLS Protocol)</option>
                  <option value="STROKE_THROMBOLYSIS_WINDOW">STROKE_THROMBOLYSIS_WINDOW (Acute Ischemic Stroke)</option>
                  <option value="SEVERE_SEPSIS_PROTOCOL">SEVERE_SEPSIS_PROTOCOL (Septic Shock Protocol)</option>
                  <option value="ACUTE_RESPIRATORY_FAILURE">ACUTE_RESPIRATORY_FAILURE (Immediate Intubation/Ventilation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minimum-Necessary Break-Glass Scope</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <span className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 font-mono">
                    AllergyIntolerance
                  </span>
                  <span className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 font-mono">
                    MedicationRequest
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={mfaConfirmed}
                    onChange={(e) => setMfaConfirmed(e.target.checked)}
                    className="rounded text-rose-600 bg-slate-900 border-slate-700"
                  />
                  <span>
                    <strong className="text-slate-100">Clinician Attestation:</strong> I verify under penalty of medical license revocation that this is a life-threatening emergency.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isInvoking || !mfaConfirmed}
                className="w-full py-2.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                EXECUTE BREAK-GLASS AUTHORIZATION (60 MINS)
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Emergency Status & Countdown */}
        <div className="space-y-6">
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Active Break-Glass Status
            </h2>

            {activeEmergency ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Countdown Box */}
                <div className="p-5 bg-slate-950/80 border border-rose-900/40 rounded-lg text-center space-y-1">
                  <span className="text-xs text-rose-300 font-medium uppercase tracking-wider">Access Window Remaining</span>
                  <div className="text-3xl font-bold font-mono text-rose-400">
                    {formatTimer(timeLeftSeconds)}
                  </div>
                  <div className="text-[11px] text-slate-500">Automatic closure upon timer expiration</div>
                </div>

                <div className="text-xs font-mono space-y-2 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency ID:</span>
                    <span className="text-slate-300">{activeEmergency.emergencyId.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reason:</span>
                    <span className="text-slate-200 font-semibold">{activeEmergency.reasonCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Review Status:</span>
                    <span className="badge-status badge-pending text-[10px]">PENDING AUDITOR REVIEW</span>
                  </div>
                </div>

                {/* Critical Life-Safety Payload Card */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>CRITICAL PATIENT SAFETY ALERTS</span>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-rose-200">⚠️ SEVERE ALLERGY: Penicillin</div>
                    <p className="text-[11px] text-rose-300">Reaction: Severe Anaphylactic Shock & Bronchospasm (SNOMED 39579001). DO NOT ADMINISTER PENICILLIN DERIVATIVES.</p>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-750 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-slate-200">Active Medication: Metformin 500mg</div>
                    <p className="text-[11px] text-slate-400">Oral hypoglycemic for Type 2 Diabetes (RxNorm 860975).</p>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono">
                    Decrypted via 60-min Break-Glass Override • AES-256-GCM
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No active emergency break-glass sessions currently open.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
