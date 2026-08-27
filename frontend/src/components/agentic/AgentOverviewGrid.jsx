import React from 'react';
import { ShieldAlert, FileCode, Flame, Search, Layers } from 'lucide-react';

const AGENTS_LIST = [
  {
    name: 'ConsentAgent',
    icon: ShieldAlert,
    color: 'teal',
    desc: 'Dynamic PDPO 2025 consent policy evaluator & purpose-binding checker.',
    role: 'Policy Guard',
  },
  {
    name: 'FHIRAgent',
    icon: FileCode,
    color: 'blue',
    desc: 'Semantic ontology normalizer (SNOMED-CT, LOINC, RxNorm) to HL7 FHIR R4.',
    role: 'Semantic Mapper',
  },
  {
    name: 'EmergencyTriageAgent',
    icon: Flame,
    color: 'red',
    desc: 'Trauma vital triage (GCS, MAP) & 60-min time-boxed break-glass token dispatcher.',
    role: 'Life Safety',
  },
  {
    name: 'AuditAgent',
    icon: Search,
    color: 'amber',
    desc: 'Forensic block scanner, SIEM analyzer & DGHS compliance dossier generator.',
    role: 'Forensics',
  },
  {
    name: 'MedraLinkOrchestrator',
    icon: Layers,
    color: 'indigo',
    desc: 'Master DAG planner coordinating agent graph & 3-tier memory hierarchy.',
    role: 'DAG Planner',
  },
];

export default function AgentOverviewGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {AGENTS_LIST.map((agent, idx) => {
        const Icon = agent.icon;
        return (
          <div
            key={idx}
            className="glass-panel p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-${agent.color}-500/10 border border-${agent.color}-500/30 text-${agent.color}-400`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {agent.role}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{agent.name}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{agent.desc}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Autonomous</span>
              <span className="text-emerald-400">● Active</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
