import React, { useState } from 'react';
import { Shield, PlayCircle, Activity, User, Stethoscope, Flame, ShieldCheck, Settings, ChevronDown, Layers, Bot } from 'lucide-react';
import { useAuth, DEMO_ROLES } from '../context/AuthContext';

export default function Navbar({ onOpenDemoTour }) {
  const { currentRole, switchRole, activePatient, networkStatus } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const activeRoleObj = DEMO_ROLES.find((r) => r.id === currentRole) || DEMO_ROLES[0];

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'Patient': return <User className="w-4 h-4 text-slate-300" />;
      case 'Clinician': return <Stethoscope className="w-4 h-4 text-sky-400" />;
      case 'Emergency': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Auditor': return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'Admin': return <Settings className="w-4 h-4 text-slate-300" />;
      case 'AgenticAI': return <Bot className="w-4 h-4 text-teal-400" />;
      default: return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/medralink_logo.jpg"
            alt="MedraLink Logo"
            style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px' }}
            className="w-9 h-9 rounded-lg object-cover border border-slate-700/80 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight">Medra<span className="text-teal-400">Link</span></span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Decentralized Healthcare Data Interoperability & Audit Provenance</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Agentic AI Studio Quick Launcher */}
          <button
            onClick={() => switchRole('AgenticAI')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              currentRole === 'AgenticAI'
                ? 'bg-slate-800 border-teal-500/50 text-teal-300'
                : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Agentic AI</span> Studio
          </button>

          {/* 9-Step Demo Launcher */}
          <button
            onClick={onOpenDemoTour}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">9-Step</span> Demo
          </button>

          {/* Block Height Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Block:</span>
            <span className="text-slate-200 font-semibold">#{networkStatus?.blockHeight || 1}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
          </div>

          {/* Active Role Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 transition-colors"
            >
              {getRoleIcon(currentRole)}
              <div className="text-left hidden sm:block">
                <span className="font-medium block leading-tight">{activeRoleObj.label}</span>
                <span className="text-2xs text-slate-400 leading-tight">{activeRoleObj.msp}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel p-1.5 text-xs shadow-xl z-50 animate-in fade-in">
                <div className="px-3 py-1.5 text-2xs uppercase font-semibold text-slate-500 tracking-wider">
                  Switch Portal Role (5 Roles)
                </div>
                {DEMO_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      switchRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors ${
                      currentRole === role.id
                        ? 'bg-slate-800 text-slate-100 font-medium'
                        : 'text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {getRoleIcon(role.id)}
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-2xs text-slate-400">{role.org}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
