import React, { useState } from 'react';
import { Shield, PlayCircle, Activity, User, Stethoscope, Flame, ShieldCheck, Settings, ChevronDown, Layers, Bot } from 'lucide-react';
import { useAuth, DEMO_ROLES } from '../context/AuthContext';

export default function Navbar({ onOpenDemoTour }) {
  const { currentRole, switchRole, activePatient, networkStatus } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const activeRoleObj = DEMO_ROLES.find((r) => r.id === currentRole) || DEMO_ROLES[0];

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'Patient': return <User className="w-4 h-4 text-teal-400" />;
      case 'Clinician': return <Stethoscope className="w-4 h-4 text-blue-400" />;
      case 'Emergency': return <Flame className="w-4 h-4 text-red-400" />;
      case 'Auditor': return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'Admin': return <Settings className="w-4 h-4 text-purple-400" />;
      case 'AgenticAI': return <Bot className="w-4 h-4 text-indigo-400" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 rounded-none bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/medralink_logo.jpg"
            alt="MedraLink Logo"
            className="w-10 h-10 rounded-xl object-cover border border-teal-500/40 shadow-lg shadow-teal-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Medra<span className="text-teal-400">Link</span></span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                BCOLBD 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Decentralized Healthcare Data Interoperability & Audit Provenance</p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Agentic AI Studio Quick Launcher */}
          <button
            onClick={() => switchRole('AgenticAI')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentRole === 'AgenticAI'
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 shadow-sm shadow-indigo-500/20'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Agentic AI</span> Studio
          </button>

          {/* 9-Step Demo Launcher */}
          <button
            onClick={onOpenDemoTour}
            className="px-3.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-teal-500/20"
          >
            <PlayCircle className="w-4 h-4 text-teal-400" />
            <span className="hidden md:inline">Live 9-Step</span> Demo Tour
          </button>

          {/* Block Height Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Block:</span>
            <span className="text-teal-300 font-bold">#{networkStatus?.blockHeight || 1}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Active Role Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
            >
              {getRoleIcon(currentRole)}
              <div className="text-left hidden sm:block">
                <span className="font-semibold block leading-tight">{activeRoleObj.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{activeRoleObj.msp}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel-glow p-2 text-xs shadow-2xl z-50 animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Switch Portal Role (5 Roles)
                </div>
                {DEMO_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      switchRole(role.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentRole === role.id
                        ? 'bg-teal-500/20 text-teal-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    {getRoleIcon(role.id)}
                    <div>
                      <div>{role.label}</div>
                      <div className="text-[10px] text-slate-400">{role.org}</div>
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
