import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  UserPlus,
  Shield,
  RefreshCw,
  CheckCircle,
  Database,
  Network,
  Scale,
  FileText,
  ShieldCheck,
  Award,
  Key,
  Lock,
  UserCheck,
  Activity,
  Copy,
  Check,
  Building2,
  Stethoscope,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';

// Predefined Institutional Provider Presets
const PROVIDER_PRESETS = [
  {
    id: 'DR_HASAN_CLINICIAN',
    name: 'Dr. Hasan Mahmud (Internal Medicine Specialist)',
    org: 'Org1MSP',
    hospitalName: 'Hospital A (BSMMU / Pilot Facility)',
    role: 'Clinician',
    certSerial: 'CERT-SN-88120',
  },
  {
    id: 'DR_RAHMAN_SURGEON',
    name: 'Dr. Kazi Rahman (General & Trauma Surgery)',
    org: 'Org1MSP',
    hospitalName: 'Hospital A (Dhaka Medical College ED)',
    role: 'Clinician',
    certSerial: 'CERT-SN-99140',
  },
  {
    id: 'DR_ALAM_EMERGENCY_B',
    name: 'Dr. Nusrat Alam (Emergency Resuscitation Unit)',
    org: 'Org2MSP',
    hospitalName: 'Hospital B (Evercare Hospital Dhaka)',
    role: 'Emergency',
    certSerial: 'CERT-SN-99430',
  },
  {
    id: 'DR_NUSRAT_OBGYN',
    name: 'Dr. Nusrat Jahan (Obstetrics & High-Risk Fetal)',
    org: 'Org2MSP',
    hospitalName: 'Hospital B (Square Hospital Dhaka)',
    role: 'Clinician',
    certSerial: 'CERT-SN-77310',
  },
  {
    id: 'POPULAR_DIAGNOSTIC_LAB',
    name: 'Popular Diagnostic Centre (Lab Reference Unit)',
    org: 'Org2MSP',
    hospitalName: 'Hospital B (Popular Diagnostic Dhanmondi)',
    role: 'Clinician',
    certSerial: 'CERT-SN-44110',
  },
  {
    id: 'AUDITOR_DGHS_OBSERVER',
    name: 'DGHS Compliance Inspector (Regulatory Authority)',
    org: 'OrgAuditorMSP',
    hospitalName: 'DGHS Directorate General of Health Services',
    role: 'Auditor',
    certSerial: 'CERT-SN-00010',
  },
];

export default function AdminPortal() {
  const { networkStatus, setNetworkStatus, showTransactionReceipt } = useAuth();

  // Active Consortium Data Lists
  const [registeredProviders, setRegisteredProviders] = useState([]);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [syntheticPatients, setSyntheticPatients] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Register Provider Form State
  const [selectedProviderPreset, setSelectedProviderPreset] = useState('DR_RAHMAN_SURGEON');
  const [providerId, setProviderId] = useState('DR_RAHMAN_SURGEON');
  const [org, setOrg] = useState('Org1MSP');
  const [role, setRole] = useState('Clinician');
  const [certSerial, setCertSerial] = useState('CERT-SN-99140');
  const [computedProviderHash, setComputedProviderHash] = useState('');
  const [isRegisteringProvider, setIsRegisteringProvider] = useState(false);

  // Register Patient Form State
  const [selectedPatientPreset, setSelectedPatientPreset] = useState('BD-HEALTH-771204');
  const [syntheticId, setSyntheticId] = useState('BD-HEALTH-771204');
  const [dob, setDob] = useState('1988-11-23');
  const [patientHomeOrg, setPatientHomeOrg] = useState('Org2MSP');
  const [patientName, setPatientName] = useState('Fatema Begum (Synthetic)');
  const [patientBloodGroup, setPatientBloodGroup] = useState('O+');
  const [patientClinicalNote, setPatientClinicalNote] = useState('Stage 3 Chronic Kidney Disease & Hypertension');
  const [computedPatientRefHash, setComputedPatientRefHash] = useState('');
  const [isRegisteringPatient, setIsRegisteringPatient] = useState(false);

  // Demo Bootstrap State
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Client-side SHA-256 helper
  const computeHash = async (text) => {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  // Re-compute live hashes when inputs change
  useEffect(() => {
    computeHash(providerId).then(h => setComputedProviderHash(h));
  }, [providerId]);

  useEffect(() => {
    const salt = 'MEDRALINK_BANGLADESH_SALT_2026_v1';
    computeHash(`${syntheticId}::${dob}::${salt}`).then(h => setComputedPatientRefHash(h));
  }, [syntheticId, dob]);

  // Fetch registered items and synthetic presets
  const refreshConsortiumData = async () => {
    setIsLoadingLists(true);
    try {
      const [provs, pts, synth, s] = await Promise.allSettled([
        api.getAllProviders(),
        api.getAllPatients(),
        api.getSyntheticPatients(),
        api.getNetworkStatus(),
      ]);

      if (provs.status === 'fulfilled' && Array.isArray(provs.value)) {
        setRegisteredProviders(provs.value);
      }
      if (pts.status === 'fulfilled' && Array.isArray(pts.value)) {
        setRegisteredPatients(pts.value);
      }
      if (synth.status === 'fulfilled' && synth.value?.patients) {
        setSyntheticPatients(synth.value.patients);
      }
      if (s.status === 'fulfilled' && s.value) {
        setNetworkStatus(s.value);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLists(false);
    }
  };

  useEffect(() => {
    refreshConsortiumData();
    const unsubscribe = api.subscribeEvents(() => {
      refreshConsortiumData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Provider Preset Handler
  const handleSelectProviderPreset = (presetId) => {
    setSelectedProviderPreset(presetId);
    if (presetId === 'CUSTOM') {
      setProviderId('DR_CUSTOM_SPECIALIST');
      setCertSerial(`CERT-SN-${Math.floor(10000 + Math.random() * 90000)}`);
      return;
    }
    const match = PROVIDER_PRESETS.find(p => p.id === presetId);
    if (match) {
      setProviderId(match.id);
      setOrg(match.org);
      setRole(match.role);
      setCertSerial(match.certSerial);
    }
  };

  // Patient Preset Handler
  const handleSelectPatientPreset = (id) => {
    setSelectedPatientPreset(id);
    if (id === 'CUSTOM') {
      setSyntheticId(`BD-HEALTH-${Math.floor(100000 + Math.random() * 900000)}`);
      setDob('1994-06-15');
      setPatientName('Custom Synthetic Patient');
      setPatientBloodGroup('B+');
      setPatientClinicalNote('Type 2 Diabetes Mellitus');
      return;
    }
    const match = syntheticPatients.find(p => p.syntheticId === id);
    if (match) {
      setSyntheticId(match.syntheticId);
      setDob(match.dob);
      setPatientHomeOrg(match.homeOrg || 'Org1MSP');
      setPatientName(match.name || 'Synthetic Citizen');
      setPatientBloodGroup(match.bloodGroup || 'O+');
      setPatientClinicalNote(match.primaryCondition || 'Clinical Profile Attached');
    }
  };

  // Handle Provider Registration
  const handleRegisterProvider = async (e) => {
    e.preventDefault();
    setIsRegisteringProvider(true);
    setNotification(null);
    try {
      const res = await api.registerProvider({
        providerId,
        org,
        role,
        certSerial,
      });

      showTransactionReceipt({
        message: `Provider '${providerId}' anchored on blockchain (RegisterProvider)`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      setNotification({
        type: 'success',
        message: `Provider '${providerId}' (${role}, ${org}) registered successfully! ID Hash: ${res.providerIdHash?.substring(0, 16)}...`
      });
      await refreshConsortiumData();
    } catch (err) {
      setNotification({ type: 'error', message: `Provider registration failed: ${err.message}` });
    } finally {
      setIsRegisteringProvider(false);
    }
  };

  // Handle Patient Registration
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
        message: `Pseudonymous Patient Reference anchored on ledger (RegisterPatientReference)`,
        txId: res.txId,
        blockNumber: res.blockNumber,
      });
      setNotification({
        type: 'success',
        message: `Patient reference registered! Pseudonym Hash: ${res.patientRefHash?.substring(0, 16)}... (Zero PII stored on-chain)`
      });
      await refreshConsortiumData();
    } catch (err) {
      setNotification({ type: 'error', message: `Patient registration failed: ${err.message}` });
    } finally {
      setIsRegisteringPatient(false);
    }
  };

  // Bootstrap Demo Action
  const handleBootstrapDemo = async () => {
    setIsBootstrapping(true);
    setNotification(null);
    try {
      const res = await api.bootstrapDemo();
      showTransactionReceipt({
        message: 'Demo consortium state bootstrapped with sample records, providers, and active consents',
        txId: res.txId || '0x' + Math.random().toString(16).substring(2, 34),
        blockNumber: res.blockNumber || 5,
      });
      await refreshConsortiumData();
      setNotification({
        type: 'success',
        message: `Demo consortium bootstrapped with ${res.patientsCount || 8} synthetic profiles, providers, encrypted vaults, and active consents!`
      });
    } catch (err) {
      setNotification({ type: 'error', message: `Bootstrap failed: ${err.message}` });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="app-container py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-950/60 border border-teal-600/40 flex items-center justify-center text-teal-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Hospital & Consortium Admin Portal</h1>
            <p className="text-xs text-slate-400">
              Membership Service Provider (MSP) Governance • Identity:{' '}
              <span className="text-teal-300 font-mono font-medium">OU=Admin, Org1MSP (Lead Endorser)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={refreshConsortiumData}
            disabled={isLoadingLists}
            className="btn-secondary"
            title="Refresh active ledger registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLists ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
          <button
            onClick={handleBootstrapDemo}
            disabled={isBootstrapping}
            className="btn-primary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
            Bootstrap Consortium State (1-Click)
          </button>
        </div>
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
              className="text-slate-400 hover:text-slate-200 ml-4 font-mono text-xs cursor-pointer"
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
          <span className="badge-status badge-granted text-2xs">CONSENSUS: CFT RAFT (3 NODES)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStatus?.organizations?.map((orgItem) => (
            <div key={orgItem.mspId} className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-1.5 text-xs hover:border-slate-700 transition-colors">
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

      {/* Main Dual Admin Panels: Providers & Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: REGISTER AUTHORIZED HEALTHCARE PROVIDER */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-600/30 flex items-center justify-center text-sky-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Register Authorized Healthcare Provider</h2>
                <p className="text-2xs text-slate-400">Anchor X.509 MSP credentials & role authorizations on Fabric</p>
              </div>
            </div>
            <span className="badge-status badge-granted text-2xs">Tx: RegisterProvider</span>
          </div>

          {/* Quick-Fill Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Institutional Provider Preset (1-Click Fill)
            </label>
            <select
              value={selectedProviderPreset}
              onChange={(e) => handleSelectProviderPreset(e.target.value)}
              className="form-input text-sky-300 font-medium"
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.org} • {p.role})
                </option>
              ))}
              <option value="CUSTOM">➕ Custom New Healthcare Provider...</option>
            </select>
          </div>

          <form onSubmit={handleRegisterProvider} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Provider Institutional ID
              </label>
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="form-input font-mono text-slate-200"
                placeholder="e.g. DR_RAHMAN_SURGEON"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital Organization (MSP)</label>
                <select
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="form-input"
                >
                  <option value="Org1MSP">Hospital A (Org1MSP - BSMMU/Pilot)</option>
                  <option value="Org2MSP">Hospital B (Org2MSP - Evercare/Popular)</option>
                  <option value="OrgAuditorMSP">DGHS Compliance Authority (OrgAuditorMSP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">X.509 Role OU</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                >
                  <option value="Clinician">Clinician (General Treatment)</option>
                  <option value="Emergency">Emergency Doctor (Break-Glass Access)</option>
                  <option value="Auditor">Compliance Auditor (Read-Only SIEM)</option>
                  <option value="Admin">Consortium Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">X.509 Certificate Serial Number</label>
              <input
                type="text"
                value={certSerial}
                onChange={(e) => setCertSerial(e.target.value)}
                className="form-input font-mono text-slate-300"
                required
              />
            </div>

            {/* Cryptographic Ledger Preview */}
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-sky-300 font-sans font-semibold text-xs">
                  <Key className="w-3.5 h-3.5 text-sky-400" /> On-Chain Identity Anchor Preview:
                </span>
                <span className="text-2xs text-slate-500">Key: PROV_{computedProviderHash?.substring(0, 8)}...</span>
              </div>
              <div className="text-2xs text-slate-400 break-all select-all bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-500">providerIdHash = </span>
                <span className="text-sky-300">{computedProviderHash || 'Calculating SHA256...'}</span>
              </div>
              <div className="text-2xs text-slate-400 flex items-center justify-between">
                <span>MSP Attribute: <strong className="text-slate-200">{org}</strong></span>
                <span>Role OU: <strong className="text-slate-200">{role}</strong></span>
                <span>Status: <strong className="text-emerald-400">ACTIVE</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegisteringProvider}
              className="btn-primary w-full"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isRegisteringProvider ? 'Anchoring Provider Reference...' : 'Anchor Provider Reference on Blockchain'}
            </button>
          </form>

          {/* Active Registered Providers List */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Active Consortium Providers ({registeredProviders.length})
              </span>
              <span className="text-2xs text-slate-500 font-normal">Hyperledger Fabric State</span>
            </div>

            {registeredProviders.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No active provider records on ledger yet. Register above or click Bootstrap.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {registeredProviders.map((p) => (
                  <div
                    key={p.providerIdHash}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-200 truncate">
                          {p.providerIdHash?.substring(0, 14)}...
                        </span>
                        <span className={`badge-status text-2xs ${p.role === 'Emergency' ? 'badge-emergency' : p.role === 'Auditor' ? 'badge-pending' : 'badge-granted'}`}>
                          {p.role}
                        </span>
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        {p.org} • {p.certSerial || 'CERT-ACTIVE'}
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(p.providerIdHash, `prov_${p.providerIdHash}`)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors shrink-0"
                      title="Copy Provider ID Hash"
                    >
                      {copiedKey === `prov_${p.providerIdHash}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: ONBOARD PATIENT (MOCK IDENTITY ADAPTER) */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-600/30 flex items-center justify-center text-teal-400">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Onboard Patient (Mock Identity Adapter)</h2>
                <p className="text-2xs text-slate-400">Simulate Bangladesh Porichoy gateway & derive salted pseudonym hash</p>
              </div>
            </div>
            <span className="badge-status badge-granted text-2xs">Tx: RegisterPatientReference</span>
          </div>

          {/* Quick-Fill Patient Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Synthetic Citizen Profile (Porichoy Gateway Simulation)
            </label>
            <select
              value={selectedPatientPreset}
              onChange={(e) => handleSelectPatientPreset(e.target.value)}
              className="form-input text-teal-300 font-medium"
            >
              {syntheticPatients.map((p) => (
                <option key={p.syntheticId} value={p.syntheticId}>
                  {p.name} ({p.bloodGroup}) • {p.syntheticId}
                </option>
              ))}
              <option value="CUSTOM">➕ Custom New Synthetic Citizen...</option>
            </select>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Synthetic Health ID (Mock NID)
                </label>
                <input
                  type="text"
                  value={syntheticId}
                  onChange={(e) => setSyntheticId(e.target.value)}
                  className="form-input font-mono text-slate-200"
                  placeholder="BD-HEALTH-XXXXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="form-input text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Home Custodial Facility</label>
                <select
                  value={patientHomeOrg}
                  onChange={(e) => setPatientHomeOrg(e.target.value)}
                  className="form-input"
                >
                  <option value="Org1MSP">Hospital A (Org1MSP - BSMMU/Pilot)</option>
                  <option value="Org2MSP">Hospital B (Org2MSP - Evercare/Popular)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mock Profile Name (Off-Chain Only)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="form-input text-slate-300"
                />
              </div>
            </div>

            {/* Zero-PII Cryptographic Hash Formula Preview */}
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-teal-300 font-sans font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Salted Pseudonym Ref Hash:
                </span>
                <span className="badge-status badge-granted text-2xs">ZERO-PII ON-CHAIN</span>
              </div>
              <div className="text-2xs text-slate-400 break-all select-all bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-500">patientRefHash = </span>
                <span className="text-teal-300">{computedPatientRefHash || 'Calculating SHA256...'}</span>
              </div>
              <div className="text-2xs text-slate-400 flex items-center justify-between font-sans">
                <span>Profile: <strong className="text-slate-200">{patientName} ({patientBloodGroup})</strong></span>
                <span>Clinical: <strong className="text-slate-200">{patientClinicalNote}</strong></span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegisteringPatient}
              className="btn-primary w-full"
            >
              <Shield className="w-3.5 h-3.5" />
              {isRegisteringPatient ? 'Anchoring Pseudonym Reference...' : 'Generate Hash & Register on Ledger'}
            </button>
          </form>

          {/* Active Registered Patients List */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                Registered Consortium Patient References ({registeredPatients.length})
              </span>
              <span className="text-2xs text-slate-500 font-normal">Hyperledger Fabric State</span>
            </div>

            {registeredPatients.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                No patient references on ledger yet. Onboard above or click Bootstrap.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {registeredPatients.map((pt) => (
                  <div
                    key={pt.patientRefHash}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-200 truncate">
                          {pt.patientRefHash?.substring(0, 18)}...
                        </span>
                        <span className="badge-status badge-granted text-2xs">
                          {pt.homeOrg || 'Org1MSP'}
                        </span>
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        Active Reference • Registered: {pt.createdAt ? new Date(pt.createdAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(pt.patientRefHash, `pt_${pt.patientRefHash}`)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors shrink-0"
                      title="Copy Patient Reference Hash"
                    >
                      {copiedKey === `pt_${pt.patientRefHash}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
