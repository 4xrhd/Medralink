# MedraLink Prototype Documentation & Architecture Index

**Competition:** Blockchain Olympiad Bangladesh (BCOLBD 2026)  
**Project:** MedraLink — Decentralized Healthcare Data Interoperability & Audit Provenance Platform  
**Master Agent Manual:** [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)  
**Track:** Student Category — Blockchain / Agentic AI Track  

---

## 🔬 Master System X-Ray Blueprint

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       1. USER INTERACTION TIER                                          │
│   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌──────────┐  │
│   │  Patient Portal   │ │ Clinician Portal  │ │ Emergency Portal  │ │  Auditor Console  │ │Admin Ctl │  │
│   │ (Granular Consent)│ │ (FHIR EMR Viewer) │ │ (Trauma Triage)   │ │ (DGHS Forensics)  │ │(Consort.)│  │
│   └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └────┬─────┘  │
└─────────────┼─────────────────────┼─────────────────────┼─────────────────────┼────────────────┼────────┘
              │                     │                     │                     │                │
              ▼                     ▼                     ▼                     ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       2. AGENTIC AI MULTI-AGENT ORCHESTRATION LAYER (DAG ENGINE)                        │
│                                                                                                         │
│                              ┌──────────────────────────────────────────┐                               │
│                              │         MedraLinkOrchestrator            │                               │
│                              │   - DAG Workflow Schedule & Dispatch     │                               │
│                              │   - Three-Tier Memory Coordinator        │                               │
│                              │   - Blockchain Settlement Controller     │                               │
│                              └─────┬──────────────┬──────────────┬──────┘                               │
│                                    │              │              │                                      │
│              ┌─────────────────────┼──────────────┼──────────────┼─────────────────────┐                │
│              │                     │              │              │                     │                │
│   ┌──────────▼──────────┐ ┌────────▼─────────┐ ┌──▼────────────┐ ┌▼──────────────────┐ ┌▼──────────────┐ │
│   │    ConsentAgent     │ │    FHIRAgent     │ │EmergencyTriage│ │    AuditAgent     │ │IdentityAdapt.│ │
│   │ - Dynamic PDPO Rules│ │ - SNOMED Bindings│ │ - GCS/MAP Calc│ │ - Block Scanner   │ │- Porichoy NID│ │
│   │ - Purpose Binding   │ │ - LOINC Lab Code │ │ - Shock Index │ │ - Anomaly Detector│ │- Salted Hash │ │
│   │ - Temporal Expiry   │ │ - RxNorm Dosage  │ │ - 60-min Token│ │ - BMDC Dossier Gen│ │- Zero-PII Gen│ │
│   │ - Fail-Closed Gate  │ │ - FHIR R4 Bundle │ │ - ESI Level 1 │ │ - Hash Continuity │ │- Ref Derived │ │
│   └──────────┬──────────┘ └────────┬─────────┘ └──┬────────────┘ └┬──────────────────┘ └┬─────────────┘ │
└──────────────┼─────────────────────┼──────────────┼───────────────┼─────────────────────┼───────────────┘
               │                     │              │               │                     │
               ▼                     ▼              ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 3. THREE-TIER MEMORY HIERARCHY LAYER                                    │
│                                                                                                         │
│   ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────┐   │
│   │   Tier 1: Session Memory        │ │   Tier 2: Vector Knowledge      │ │ Tier 3: Ledger State    │   │
│   │   - Ephemeral Node.js Context   │ │   - SNOMED-CT / LOINC / RxNorm  │ │ - World State (CouchDB) │   │
│   │   - Active Clinician Identity   │ │   - Clinical Practice Rules     │ │ - Block Hash Store      │   │
│   │   - Intermediate DAG Payloads   │ │   - PDPO 2025 Legal Statutes    │ │ - Composite Key Index   │   │
│   └─────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────────┬───────────────────────┘
                                       │ gRPC / REST                              │ Encrypted I/O
                                       ▼                                          ▼
┌───────────────────────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│     4. PERMISSIONED BLOCKCHAIN (Hyperledger Fabric 2.5)   │ │  5. OFF-CHAIN ENCRYPTED CLINICAL STORE    │
│   - Channel: `medralink-main`                             │ │   - Custodial Hospital Cloud Vault        │
│   - 9 Canonical Smart Contract Transactions (Go)          │ │   - AES-256-GCM Envelope Encryption (DEK) │
│   - 3-Node Raft Crash Fault Tolerant Consensus Cluster    │ │   - Plaintext Zero-PII FHIR Payloads      │
│   - Cryptographic Proof Anchors: recordHash, patientHash  │ │   - Storage Pointer: s3://vault/rec.enc   │
└───────────────────────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 📚 Complete Technical Documentation Suite

| Document | Purpose & Contents | Primary Audience |
|---|---|---|
| 📋 [`Medralink_Prototype_Execution_Plan_v1.0.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/Medralink_Prototype_Execution_Plan_v1.0.md) | Master 12-day execution roadmap, self-evaluated against the BCOLBD scoring rubric (Score: 90/100). | Evaluators & Team |
| 🤖 [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md) | Autonomous 5-Agent Architecture (`ConsentAgent`, `FHIRAgent`, `EmergencyTriageAgent`, `AuditAgent`, `MedraLinkOrchestrator`), DAG Execution Model, Inter-Agent Message Bus & 3-Tier Memory. | AI & System Evaluators |
| 🏛️ [`ARCHITECTURE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/ARCHITECTURE_SPECIFICATION.md) | Deep dive into multi-tier topology X-Ray, Raft consensus block commit pipeline, node topologies, and on-chain / off-chain cryptographic separation. | Technical Evaluators |
| 📜 [`CHAINCODE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/CHAINCODE_SPECIFICATION.md) | Technical contract specification, composite key trie graph, state machine, and validation pipeline for all **9 Canonical Smart Contract Transactions** in Go. | Blockchain Judges |
| 🏥 [`FHIR_INTEROPERABILITY_GUIDE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/FHIR_INTEROPERABILITY_GUIDE.md) | HL7 FHIR R4 semantic normalization X-Ray, terminology bindings (SNOMED, LOINC, RxNorm), and AES-256-GCM authenticated encryption. | Healthcare IT Judges |
| 🛡️ [`GOVERNANCE_AND_SECURITY_MANUAL.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/GOVERNANCE_AND_SECURITY_MANUAL.md) | 3-Pillar Governance Triad X-Ray, PDPO 2025 compliance, tokenless rationale, and emergency break-glass accountability loop. | Governance Judges |
| 🎬 [`DEMO_SCRIPT.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/DEMO_SCRIPT.md) | Step-by-step 9-stage live demonstration walkthrough & execution pipeline matching Whitepaper Section G. | Pitch Presenters |
| 🧪 [`TESTING_AND_QA_REPORT.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/TESTING_AND_QA_REPORT.md) | Automated unit and integration test reports (100% test pass rate across 13 API suites and 4 Go test suites). | QA & Code Auditors |
| 🏆 [`COMPETITION_PRESENTATION_GUIDE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/COMPETITION_PRESENTATION_GUIDE.md) | 10-Minute pitch video guide and judge Q&A defense playbook. | Pitch Team |
| 🚀 [`SETUP_GUIDE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/SETUP_GUIDE.md) | Local and cloud deployment instructions (Docker, Podman, Oracle Cloud Always Free). | Developers & SysAdmins |
| 🌐 [`API_REFERENCE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/API_REFERENCE.md) | REST API endpoint specification with request/response schemas including `/agents/*` routes. | Frontend/App Developers |
| 🎨 [`IMAGE_GENERATION_PROMPTS.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/IMAGE_GENERATION_PROMPTS.md) | Curated AI image generation prompts for logos, Bangladesh health cards, UI mockups & posters. | Media & Design Team |
