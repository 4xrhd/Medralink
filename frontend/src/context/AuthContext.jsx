import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const DEMO_ROLES = [
  { id: 'Patient', label: 'Patient (Citizen)', org: 'Hospital A User', icon: 'User', msp: 'Org1MSP' },
  { id: 'Clinician', label: 'Authorized Clinician', org: 'Hospital A (Pilot)', icon: 'Stethoscope', msp: 'Org1MSP' },
  { id: 'Emergency', label: 'Emergency Clinician', org: 'Hospital B (ED)', icon: 'Flame', msp: 'Org2MSP' },
  { id: 'Auditor', label: 'Network Auditor', org: 'DGHS Compliance', icon: 'ShieldCheck', msp: 'OrgAuditorMSP' },
  { id: 'Admin', label: 'Consortium Admin', org: 'Hospital A Admin', icon: 'Settings', msp: 'Org1MSP' },
  { id: 'AgenticAI', label: 'Agentic AI Multi-Agent Studio', org: '5 Autonomous Agents', icon: 'Bot', msp: 'DAG Orchestrator' },
];

export function AuthProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(
    localStorage.getItem('medralink_demo_role') || 'Patient'
  );
  const [activePatient, setActivePatient] = useState(null);
  const [recentTransaction, setRecentTransaction] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);

  useEffect(() => {
    localStorage.setItem('medralink_demo_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    // Initial fetch of synthetic patients and network status
    api.getSyntheticPatients()
      .then((res) => {
        if (res.patients && res.patients.length > 0) {
          setActivePatient(res.patients[0]);
        }
      })
      .catch(console.error);

    api.getNetworkStatus()
      .then(setNetworkStatus)
      .catch(console.error);
  }, []);

  const switchRole = (role) => {
    localStorage.setItem('medralink_demo_role', role);
    setCurrentRole(role);
  };

  const showTransactionReceipt = (txData) => {
    setRecentTransaction({
      ...txData,
      timestamp: new Date().toLocaleTimeString(),
    });
    // Auto-refresh network status to reflect new block height
    api.getNetworkStatus().then(setNetworkStatus).catch(console.error);
  };

  const closeReceipt = () => {
    setRecentTransaction(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        switchRole,
        activePatient,
        setActivePatient,
        recentTransaction,
        showTransactionReceipt,
        closeReceipt,
        networkStatus,
        setNetworkStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
