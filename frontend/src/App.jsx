import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import TransactionReceipt from './components/TransactionReceipt';
import DemoTourModal from './components/DemoTourModal';

// Route-level Dynamic Code-Splitting
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
const ClinicianPortal = lazy(() => import('./pages/ClinicianPortal'));
const EmergencyPortal = lazy(() => import('./pages/EmergencyPortal'));
const AuditorPortal = lazy(() => import('./pages/AuditorPortal'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const AgenticAIPortal = lazy(() => import('./pages/AgenticAIPortal'));

function LoadingFallback() {
  return (
    <div className="app-container py-16 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin"></div>
      <span className="text-xs font-mono text-slate-400">Loading MedraLink Consortium Module...</span>
    </div>
  );
}

function PortalRouter() {
  const { currentRole } = useAuth();

  let Component;
  switch (currentRole) {
    case 'Patient':
      Component = PatientPortal;
      break;
    case 'Clinician':
      Component = ClinicianPortal;
      break;
    case 'Emergency':
      Component = EmergencyPortal;
      break;
    case 'Auditor':
      Component = AuditorPortal;
      break;
    case 'Admin':
      Component = AdminPortal;
      break;
    case 'AgenticAI':
      Component = AgenticAIPortal;
      break;
    default:
      Component = PatientPortal;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Banner />
        <Navbar onOpenDemoTour={() => setIsDemoTourOpen(true)} />
        <main className="flex-1">
          <PortalRouter />
        </main>
        <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 bg-slate-950/60 backdrop-blur-sm">
          <div className="app-container flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MedraLink Prototype | Decentralized Healthcare Interoperability & Audit Provenance</span>
            <span className="font-mono text-slate-400">Hyperledger Fabric 2.5 • HL7 FHIR R4 • Zero PII On-Chain</span>
          </div>
        </footer>
        <TransactionReceipt />
        <DemoTourModal isOpen={isDemoTourOpen} onClose={() => setIsDemoTourOpen(false)} />
      </div>
    </AuthProvider>
  );
}
