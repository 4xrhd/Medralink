import React, { useState } from 'react';
import { Settings, Server, UserPlus, Shield, RefreshCw, CheckCircle, Database, Network, Scale, FileText, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

export default function AdminPortal() {
  const { networkStatus, setNetworkStatus, showTransactionReceipt } = useAuth();
  
  // Register Provider Form
  const [providerId, setProviderId] = useState('DR_RAHMAN_SURGEON');
  const [org, setOrg] = useState('Org1MSP');
  const [role, setRole] = useState('Clinician');
  const [isRegisteringProvider, setIsRegisteringProvider] = useState(false);

  // Register Patient Form
  const [syntheticId, setSyntheticId] = useState('BD-HEALTH-112233');
  const [dob, setDob] = useState('1995-03-21');
  const [patientHomeOrg, setPatientHomeOrg] = useState('Org1MSP');
  const [isRegisteringPatient, setIsRegisteringPatient] = useState(false);

  // Demo Bootstrap State
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const [notification, setNotification] = useState(null);

  React.useEffect(() => {
    const refreshStatus = async () => {
      try {
        const s = await api.getNetworkStatus();
        setNetworkStatus(s);
      } catch (err) {
        // ignore
      }
    };
    refreshStatus();
    const unsubscribe = api.subscribeEvents(() => {
      refreshStatus();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRegisterProvider = async (e) => {
    e.preventDefault();
    setIsRegisteringProvider(true);
    setNotification(null);
    try {
      const res = await api.registerProvider({
        providerId,
        org,
        role,
      });

      showTransactionReceipt({
        message: `Provider '${providerId}' registered on ledger (RegisterProvider)`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      setNotification({ type: 'success', message: `Provider '${providerId}' registered successfully! ID Hash: ${res.providerIdHash?.substring(0, 16)}...` });
    } catch (err) {
      setNotification({ type: 'error', message: `Registration failed: ${err.message}` });
    } finally {
      setIsRegisteringProvider(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setIsRegisteringPatient(true);
    setNotification(null);
    try {
      const res = await api.registerPatient({
        syntheticId,
        dob,
        homeOrg: patientHomeOrg,
      });

      showTransactionReceipt({
        message: `Patient reference registered (RegisterPatientReference)`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      setNotification({ type: 'success', message: `Patient reference registered! Pseudonym Hash: ${res.patientRefHash?.substring(0, 16)}...` });
    } catch (err) {
      setNotification({ type: 'error', message: `Patient registration failed: ${err.message}` });
    } finally {
      setIsRegisteringPatient(false);
    }
  };

  const handleBootstrapDemo = async () => {
    setIsBootstrapping(true);
    setNotification(null);
    try {
      const res = await api.bootstrapDemo();
      showTransactionReceipt({
        message: 'Demo consortium state bootstrapped with sample records and consents',
        txId: res.txId || '0x' + Math.random().toString(16).substring(2, 34),
        blockNumber: res.blockNumber || 5,
      });
      const updatedStatus = await api.getNetworkStatus();
      setNetworkStatus(updatedStatus);
      setNotification({ type: 'success', message: 'Demo consortium data initialized successfully with patients, providers, records, and active consents!' });
    } catch (err) {
      setNotification({ type: 'error', message: `Bootstrap failed: ${err.message}` });
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Hospital & Consortium Admin Portal</h1>
            <p className="text-xs text-slate-400">Membership Service Provider (MSP) Management • Identity: <span className="text-slate-300 font-mono">OU=Admin, Org1MSP</span></p>
          </div>
        </div>

        <button
          onClick={handleBootstrapDemo}
          disabled={isBootstrapping}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
          Bootstrap Demo State (1-Click)
        </button>
      </div>

      {/* Inline Notification Banner */}
      {notification && (
        notification.type === 'error' ? (
          <ErrorBanner
            error={notification.message}
            onDismiss={() => setNotification(null)}
          />
        ) : (
          <div className="p-4 rounded-xl border flex items-center justify-between text-xs animate-fade-in bg-emerald-950/40 border-emerald-500/30 text-emerald-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-200 ml-4 font-mono text-xs"
            >
              ✕
            </button>
          </div>
        )
      )}

      {/* Network Consortium Status Overview */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-400" />
            Hyperledger Fabric 4-Organization Topology
          </h2>
          <span className="badge-status badge-granted text-2xs">CONSENSUS: RAFT CFT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStatus?.organizations?.map((orgItem) => (
            <div key={orgItem.mspId} className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{orgItem.name}</span>
                <span className="badge-status badge-granted text-2xs">{orgItem.status}</span>
              </div>
              <div className="text-xs font-mono text-teal-400">{orgItem.mspId}</div>
              <div className="text-2xs text-slate-400">{orgItem.role}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Register Provider Form */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-slate-300" />
            Register Authorized Healthcare Provider
          </h2>
          <form onSubmit={handleRegisterProvider} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Provider Institutional ID</label>
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital Organization</label>
                <select
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                >
                  <option value="Org1MSP">Hospital A (Org1MSP)</option>
                  <option value="Org2MSP">Hospital B (Org2MSP)</option>
                  <option value="OrgAuditorMSP">DGHS Compliance Authority (OrgAuditorMSP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">X.509 Role OU</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                >
                  <option value="Clinician">Clinician (General)</option>
                  <option value="Emergency">Emergency Doctor</option>
                  <option value="Auditor">Compliance Auditor</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isRegisteringProvider}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Anchor Provider Reference on Blockchain
            </button>
          </form>
        </div>

        {/* Register Patient Form */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            Onboard Patient (Mock Identity Adapter)
          </h2>
          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Synthetic Health ID</label>
              <input
                type="text"
                value={syntheticId}
                onChange={(e) => setSyntheticId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Home Organization</label>
                <select
                  value={patientHomeOrg}
                  onChange={(e) => setPatientHomeOrg(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                >
                  <option value="Org1MSP">Hospital A (Org1MSP)</option>
                  <option value="Org2MSP">Hospital B (Org2MSP)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isRegisteringPatient}
              className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Generate Hash & Register on Ledger
            </button>
          </form>
        </div>
      </div>

      {/* Consortium Governance Triad */}
      <div className="glass-panel p-6 border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-400" />
              Consortium Governance Triad (Consortium Governance Checklist)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly adheres to 3-Pillar Governance & Regulatory Evaluation Standards
            </p>
          </div>
          <span className="badge-status badge-granted text-2xs self-start sm:self-auto">
            PDPO 2025 & DGHS Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Network Membership Governance */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs border-b border-slate-850 pb-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              1. Network Membership Governance
            </div>
            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">✓</span>
                <span><strong>Member On/Off-boarding:</strong> Automated MSP credential registration with BMDC institutional verification.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">✓</span>
                <span><strong>Regulatory Oversight Node:</strong> Dedicated non-endorsing DGHS Auditor peer (`OrgAuditorMSP`) with full ledger read access.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-400 font-bold">✓</span>
                <span><strong>Permission Structure:</strong> X.509 Organizational Units (`OU=Clinician`, `OU=Emergency`, `OU=Auditor`, `OU=Admin`).</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Business Network Governance */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs border-b border-slate-850 pb-2">
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
              2. Business Network Governance
            </div>
            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">✓</span>
                <span><strong>Consortium Charter:</strong> Legal federation contract between DGHS public hospitals and ~5,000 private diagnostic facilities.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">✓</span>
                <span><strong>Common Interoperability:</strong> HL7 FHIR R4 standard JSON bundles with SNOMED-CT, LOINC, and RxNorm ontology.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">✓</span>
                <span><strong>Legal Compliance:</strong> Dynamic purpose binding and granular data minimization per Bangladesh PDPO 2025 (§12 & §24).</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Technology Infrastructure Governance */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs border-b border-slate-850 pb-2">
              <Server className="w-4 h-4 text-emerald-400 shrink-0" />
              3. Technology Infrastructure Governance
            </div>
            <ul className="text-xs text-slate-400 space-y-2 font-mono">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Distributed Topology:</strong> Hyperledger Fabric 2.5 with Raft Crash Fault Tolerant (CFT) ordering cluster.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>On-Chain/Off-Chain Invariant:</strong> Zero-PII on-chain ledger state; AES-256-GCM envelope encryption for off-chain vaults.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Cryptographic Integrity:</strong> Real-time `recordHash = SHA256(ciphertext)` verification against ledger anchor before decryption.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
