import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import TransactionReceipt from './components/TransactionReceipt';
import DemoTourModal from './components/DemoTourModal';

import PatientPortal from './pages/PatientPortal';
import ClinicianPortal from './pages/ClinicianPortal';
import EmergencyPortal from './pages/EmergencyPortal';
import AuditorPortal from './pages/AuditorPortal';
import AdminPortal from './pages/AdminPortal';
import AgenticAIPortal from './pages/AgenticAIPortal';

function PortalRouter() {
  const { currentRole } = useAuth();

  switch (currentRole) {
    case 'Patient':
      return <PatientPortal />;
    case 'Clinician':
      return <ClinicianPortal />;
    case 'Emergency':
      return <EmergencyPortal />;
    case 'Auditor':
      return <AuditorPortal />;
    case 'Admin':
      return <AdminPortal />;
    case 'AgenticAI':
      return <AgenticAIPortal />;
    default:
      return <PatientPortal />;
  }
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
