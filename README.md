# MedraLink — Decentralized Healthcare Data Interoperability & Audit Provenance Platform

> ⚠️ **IMPORTANT NOTICE & SYNTHETIC DATA DISCLAIMER:**  
> **This repository is a SYNTHETIC MedraLink Prototype, NOT the original live hospital deployment.**  
> All patient records, National ID references, clinical vitals, diagnostic summaries, and provider cryptographic identities contained herein are **100% synthetic mock datasets** generated exclusively for demonstration, testing, and evaluation at the **Blockchain Olympiad Bangladesh (BCOLBD 2026)**.  
> **Zero real Personally Identifiable Information (PII)** or real patient health records are stored, processed, or anchored on this ledger.

---

## 🎯 Project Overview & Mission

**MedraLink** is an enterprise-grade, consent-driven healthcare data interoperability and audit provenance platform tailored for the pluralistic healthcare ecosystem of Bangladesh. It unites an **Autonomous Agentic AI Multi-Agent Orchestration Layer** with a **Tokenless Hyperledger Fabric 2.5 Permissioned Blockchain Consortium**.

* **Competition:** Blockchain Olympiad Bangladesh (BCOLBD 2026)
* **Track:** Student Category — Blockchain / Agentic AI Track
* **Team ID:** `6a7f5f0a67368`
* **Institution:** University of Information Technology and Sciences (UITS), Dhaka, Bangladesh

---

## 🔬 System Architecture Blueprint

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

## 📂 Repository Directory Structure

```
.
├── chaincode/medralink-cc/    # Go Smart Contracts (All 9 Canonical Transactions + Composite Keys)
├── api/                       # Node.js 20 REST Gateway (13 Endpoints, AES-256-GCM, Agentic AI DAG)
├── frontend/                  # React.js 18 SPA (5 Role Portals + Agentic AI Studio + 9-Step Demo)
├── network/                   # 4-Org Hyperledger Fabric 2.5 Consortium Topology (Raft Consensus)
├── docs/                      # 12 Detailed Technical Guides & X-Ray Architecture Specs
│   ├── AGENTIC_AI_ARCHITECTURE.md        # 🤖 5 Autonomous Agents, DAG Engine & 3-Tier Memory
│   ├── ARCHITECTURE_SPECIFICATION.md     # 🏛️ 4-Tier Topology & Raft Consensus Commit Pipeline
│   ├── CHAINCODE_SPECIFICATION.md        # 📜 9 Canonical Transactions State Machine & Key Trie
│   ├── FHIR_INTEROPERABILITY_GUIDE.md    # 🏥 HL7 FHIR Semantic Normalization & Cryptographic Envelope
│   ├── GOVERNANCE_AND_SECURITY_MANUAL.md # 🛡️ 3-Pillar Consortium Governance Triad & Emergency Loop
│   ├── DEMO_SCRIPT.md                    # 🎬 9-Stage Live Demonstration Pipeline
│   ├── TESTING_AND_QA_REPORT.md          # 🧪 100% Automated QA Verification Report (15 test suites)
│   ├── COMPETITION_PRESENTATION_GUIDE.md # 🏆 Pitch Video Script & Judge Q&A Playbook
│   ├── SETUP_GUIDE.md                    # 🚀 Deployment Instructions (Docker, Cloud)
│   ├── API_REFERENCE.md                  # 🌐 REST API Reference & Request/Response Schemas
│   └── README.md                         # 📚 Master Documentation Index
├── Makefile                   # 🚀 Automation Commands (setup, test, build, api, frontend)
└── README.md                  # Master Repository Overview & Disclaimer
```

---

## ⚙️ Core Technical Highlights

### 1. 🤖 Five Specialized Autonomous AI Agents
* **`ConsentAgent`:** Dynamic policy evaluator enforcing purpose-binding, scope limits, and temporal expiration under the **Bangladesh Personal Data Protection Ordinance (PDPO 2025)**.
* **`FHIRAgent`:** Semantic normalization engine binding raw notes to **SNOMED-CT**, **LOINC**, and **RxNorm** ontologies.
* **`EmergencyTriageAgent`:** Evaluates trauma vitals (GCS $\le 8$, $\text{MAP} < 65\text{ mmHg}$, Shock Index $> 1.0$), issuing a **60-minute time-boxed emergency break-glass token**.
* **`AuditAgent`:** Forensic scanner continuously verifying ledger hash-chain continuity ($\text{SHA256}$) and detecting access anomalies for the DGHS compliance auditor.
* **`MedraLinkOrchestrator`:** Master DAG planner managing the three-tiered memory hierarchy (Session, Vector Index, Fabric Ledger).

### 2. 📜 The Nine (9) Canonical Chaincode Transactions
1. `RegisterPatientReference(patientRef, homeOrg)`
2. `RegisterProvider(providerID, org, role, certSerial)`
3. `CreateRecordReference(recordID, patientRef, recordHash, opaquePointerHash, custodialOrg)`
4. `GrantConsent(consentID, patientRef, grantee, scope, purpose, expiryTimestamp)`
5. `RevokeConsent(consentID, patientRef)`
6. `RequestAccess(requestID, patientRef, consentID, accessorHash, scope, purpose)`
7. `LogAccess(requestID, patientRef, accessorHash, scope, purpose, status)`
8. `InvokeEmergencyAccess(emergencyID, clinicianIDHash, patientRef, reasonCode, scope, expiryTimestamp)`
9. `ReviewEmergencyAccess(emergencyID, auditorIDHash, reviewStatus, findingsHash)`

### 3. 🛡️ Strict On-Chain vs. Off-Chain Cryptographic Separation
* **On-Chain (Hyperledger Fabric):** Salted pseudonymous patient reference hashes (`patientRefHash = SHA256(HealthID || DOB || Salt)`), provider X.509 certificates, granular consent tokens, immutable audit logs, and ciphertext integrity hashes (`recordHash = SHA256(ciphertext)`).
* **Off-Chain (Custodial Vaults):** AES-256-GCM envelope-encrypted HL7 FHIR R4 clinical payloads.
* **Invariant:** **Zero Personally Identifiable Information (PII)** is ever stored on the blockchain ledger.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** v20+ LTS and `npm`
* **Go** v1.22+
* **Docker** & **Docker Compose** (for full multi-node consortium simulation)

### One-Command Setup & Testing
```bash
# 1. Install all dependencies across API and Frontend
make setup

# 2. Run all unit and integration tests (100% PASS)
make test

# 3. Build production bundles (React 18 Frontend + Go Chaincode)
make build
```

### Launching the Interactive Platform
```bash
# Terminal 1: Launch REST API Gateway (Port 3001)
make api

# Terminal 2: Launch React Web Portals (Port 5173)
make frontend
```

Open `http://localhost:5173` in your browser to access:
* 👤 **Patient Portal:** Manage granular consent tokens and inspect immutable access audit trails.
* 🩺 **Clinician Portal:** Verify on-chain consent and render decrypted FHIR R4 clinical bundles.
* 🚨 **Emergency Break-Glass Portal:** Trigger 60-min emergency override with life-safety allergy alerts.
* 🛡️ **DGHS Auditor Console:** Review emergency justifications and verify tamper-proof block hash continuity.
* ⚙️ **Hospital Admin Portal:** Onboard providers and inspect 4-org consortium status.
* 🤖 **Agentic AI Studio:** Interactive sandboxes for all 5 autonomous agents & DAG orchestration workflows.
* 🎬 **9-Step Live Demo Tour:** Guided walkthrough demonstrating end-to-end blockchain and AI operations.

---

## 📄 License & Attribution

Developed for **Blockchain Olympiad Bangladesh (BCOLBD 2026)** by Team **MedraLink** (Team ID: `6a7f5f0a67368`), University of Information Technology and Sciences (UITS), Dhaka, Bangladesh.
