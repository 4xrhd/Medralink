# MedraLink Prototype — Complete Professional Execution Plan
## BCOLBD 2026 Finalist Submission | Free Resources Only

**Version:** 1.0 — Self-Evaluated & Refined  
**Last Updated:** 17 August 2026  
**Target Deadline:** 2 September 2026 (Final round submission)  
**Team:** Kazi Md Azhar Uddin Abeer, Ahmad Abdali Khan, Sumaia Bintey Ismail  

---

## 📌 Section 0: BCOLBD Prototype Evaluation Rubric (What Judges Score)

Per the Official BCOLBD 2026 Blockchain Guideline:

### Mandatory Criteria (Pass/Fail — Must Pass Both)
| # | Requirement | Our Target |
|---|---|---|
| i. | **Front-end:** Prototype must have a user interface | ✅ React.js web app with Patient, Clinician, Emergency, Auditor portals |
| ii. | **Back-end:** Prototype must write to a blockchain | ✅ Hyperledger Fabric chaincode with genuine ledger writes visible in Explorer |

### Graded Criteria (100 Points)
| Criterion | Points | What Judges Look For | Our Coverage Strategy |
|---|:---:|---|---|
| **i. Problem & Solution** | **40** | Why blockchain? What pain point? Does solution address it? | Live demo of consent→access→revoke→emergency→audit loop |
| **ii. Privacy & Security** | **20** | Data privacy, identity privacy, key management, access control | Zero PII on-chain, AES-256-GCM off-chain, X.509 MSP, scoped consent |
| **iii. Architecture** | **20** | Consensus setup, on/off-chain split, data model, legacy integration, identity | Fabric Raft, Docker Compose, FHIR adapter, block explorer |
| **iv. Governance** | **20** | Trust model, decentralized governance | 3-pillar governance: Network Membership + Business Network + Tech Infra |

---

## 📌 Section 1: Architecture Overview

### 1.1 System Topology (Matches Whitepaper Figure 1 Exactly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER (React.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Patient      │  │ Clinician    │  │ Emergency    │  │ Auditor      │    │
│  │ Portal       │  │ Portal       │  │ Portal       │  │ Dashboard    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                     │                                       │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                         GATEWAY LAYER (Node.js/Express)                     │
│  ┌──────────────────────────────────┼──────────────────────────────────┐    │
│  │  REST API Gateway               │                                   │    │
│  │  ├─ FHIR R4 JSON endpoints      │                                   │    │
│  │  ├─ Fabric SDK (fabric-gateway)  │                                   │    │
│  │  ├─ Identity & Auth (JWT + X.509)│                                   │    │
│  │  ├─ Encryption Service (AES-256) │                                   │    │
│  │  └─ Mock Identity Adapter        │                                   │    │
│  └──────────────────────────────────┼──────────────────────────────────┘    │
│                                     │                                       │
├─────────────────────────────────────┼───────────────────────────────────────┤
│                    HYPERLEDGER FABRIC NETWORK (Docker)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐        │
│  │ Org1     │  │ Org2     │  │ Org3     │  │ OrgAuditor          │        │
│  │ Peer0    │  │ Peer0    │  │ Peer0    │  │ Peer0 (read-only)   │        │
│  │ CA       │  │ CA       │  │ CA       │  │ CA                  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘        │
│       └──────────────┴──────────────┴──────────────────┘                    │
│                          │ Raft Orderer Cluster │                            │
│                          └──────────────────────┘                            │
│  Channel: medralink-main                                                    │
│  Chaincode: medralink-cc (Go)                                               │
│  Explorer: Hyperledger Explorer                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                    OFF-CHAIN ENCRYPTED STORAGE                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  CouchDB / LevelDB (world state) + Encrypted FHIR Bucket       │       │
│  │  AES-256-GCM encrypted FHIR bundles (AllergyIntolerance,       │       │
│  │  MedicationRequest) — only SHA-256 hashes stored on-chain       │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Organizations & Node Roles (Pilot 3+1)

| Org | Members | Nodes | Endorsement Role |
|---|---|---|---|
| **Org1 — Pilot Hospital A** | Patients of A, Clinicians of A, Admin A | 1 Peer, 1 CA (Org1MSP), 1 Raft orderer | Endorses consent/records for its patients |
| **Org2 — Pilot Hospital B** | Patients of B, Lab technicians, Clinicians of B | 1 Peer, 1 CA (Org2MSP), 1 Raft orderer | Endorses consent/records + lab DiagnosticReports |
| **Org3 — Medralink Operator** | Gateway service, SRE | 1 Peer (non-endorsing), 1 CA, 1 Raft orderer | Gateway + Ordering only, not endorsing consent |
| **OrgAuditor — Observer** | Network Auditor / DGHS | 1 Peer (audit replica), 1 CA (AuditorMSP) | Read-only queries + ReviewEmergencyAccess |

### 1.3 User Roles (Canonical — Do Not Rename)

| Role | Who | Auth Method | Capabilities |
|---|---|---|---|
| **Patient** | Citizen with synthetic Health ID | App: password + OTP (mock) + Fabric client cert | GrantConsent, RevokeConsent, view own audit trail |
| **Authorized Clinician** | Doctor/nurse in pilot hospital | X.509 OU=Clinician + MFA | RequestAccess within consented scope → LogAccess |
| **Emergency Clinician** | ED doctor with emergency binding | X.509 OU=Emergency + step-up MFA + reasonCode | InvokeEmergencyAccess (time-boxed, min scope) |
| **Hospital Administrator** | Hospital admin for org config | X.509 OU=Admin + MFA | RegisterProvider, manage RBAC for own org |
| **Network Auditor** | DGHS/MIS observer or team role | X.509 OU=Auditor (read-only MSP) | Query audit history, ReviewEmergencyAccess |

---

## 📌 Section 2: Technology Stack (100% Free / Open-Source)

### 2.1 Core Stack

| Layer | Technology | Version | License | Why Chosen |
|---|---|---|:---:|---|
| **Blockchain** | Hyperledger Fabric | 2.5 LTS | Apache 2.0 | Permissioned consortium, MSP identity, channels, zero-crypto |
| **Smart Contract** | Go (Fabric Contract API) | 1.21+ | BSD | Official Fabric SDK, strong typing, whitepaper alignment |
| **Backend API** | Node.js + Express | 20 LTS | MIT | fabric-gateway npm, fast prototyping |
| **Frontend** | React.js + Vite | 18+ | MIT | Component portals, SPA, free hosting |
| **Styling** | Tailwind CSS | 3.x | MIT | Rapid UI, medical-grade clean aesthetic |
| **Block Explorer** | Hyperledger Explorer | Latest | Apache 2.0 | Native Fabric explorer with block/tx views |
| **Off-Chain Store** | CouchDB (Fabric state) + Local FS | 3.x | Apache 2.0 | Rich queries, JSON document store |
| **Encryption** | Node.js crypto (AES-256-GCM) | Built-in | — | FHIR bundle encryption/decryption |
| **FHIR Validation** | HAPI FHIR Validator (Java) or fhir.js | R4 | Apache 2.0 | Validate synthetic clinical data |
| **Identity/Auth** | JWT + Fabric CA X.509 | — | — | Role-based portal access |
| **Containerization** | Docker + Docker Compose | Latest | Apache 2.0 | One-command network bootstrap |
| **Version Control** | Git + GitHub | — | Free | Source control and collaboration |

### 2.2 Free Hosting & Infrastructure

| Service | Provider | Free Tier | Use |
|---|---|---|---|
| **Cloud VM** | Oracle Cloud Free Tier | 4 ARM vCPU, 24 GB RAM (Always Free) | Run full Fabric network + API + Explorer |
| **Alternative VM** | Google Cloud Free Tier (e2-micro) | 1 vCPU, 1 GB RAM | Lightweight alternative |
| **Frontend Hosting** | Vercel / Netlify | Unlimited deploys | Host React SPA |
| **DNS** | Cloudflare Free | Free DNS + SSL | Custom domain if needed |
| **Code Repository** | GitHub | Free private repos | Source code + CI |
| **CI/CD** | GitHub Actions | 2,000 min/month free | Automated testing |

> **Primary Recommendation:** Oracle Cloud Always Free (4 ARM cores + 24GB RAM) is the best option — it can comfortably run the entire Fabric network, API server, Explorer, and CouchDB simultaneously.

---

## 📌 Section 3: Repository Structure

```
medralink-prototype/
│
├── network/                              # Hyperledger Fabric Network Configuration
│   ├── docker-compose.yaml               # Full network: 4 peers, 3 orderers, 4 CAs, CouchDB, Explorer
│   ├── configtx.yaml                     # Channel configuration (medralink-main)
│   ├── crypto-config.yaml                # MSP crypto material generation
│   ├── scripts/
│   │   ├── bootstrap.sh                  # One-command network setup
│   │   ├── createChannel.sh              # Channel creation & join
│   │   ├── deployChaincode.sh            # Chaincode install, approve, commit
│   │   ├── registerUsers.sh              # Register all 5 role types via CA
│   │   └── teardown.sh                   # Clean shutdown
│   └── explorer/
│       ├── config.json                   # Hyperledger Explorer config
│       └── connection-profile.json       # Explorer connection to Fabric
│
├── chaincode/                            # Smart Contract (Go)
│   └── medralink-cc/
│       ├── go.mod
│       ├── go.sum
│       ├── main.go                       # Contract entry point
│       ├── contract.go                   # All 9 canonical transactions
│       ├── models.go                     # On-chain data structures
│       ├── validation.go                 # MSP/OU, scope, expiry, PII guards
│       ├── events.go                     # Chaincode event definitions
│       └── contract_test.go              # Unit tests
│
├── api/                                  # Backend Gateway (Node.js + Express)
│   ├── package.json
│   ├── src/
│   │   ├── server.js                     # Express app entry
│   │   ├── routes/                       # 12 REST API endpoints
│   │   ├── middleware/                    # JWT + role guards + error handler
│   │   ├── services/                     # Fabric, encryption, identity, FHIR, hash
│   │   └── data/synthetic/               # Synthetic FHIR bundles for demo
│   └── tests/
│
├── frontend/                             # React.js SPA (Vite)
│   ├── src/
│   │   ├── pages/                        # Login, Patient, Clinician, Emergency, Auditor portals
│   │   ├── components/                   # UI components per role + common
│   │   ├── services/api.js               # Axios API client
│   │   └── context/AuthContext.jsx       # Auth state management
│
├── docs/                                 # Documentation
│   ├── DEMO_SCRIPT.md                    # 9-step demo walkthrough for judges
│   ├── API_REFERENCE.md                  # All 12 REST endpoints
│   └── SETUP_GUIDE.md                    # Local + cloud deployment instructions
│
├── Makefile                              # make setup, make demo, make teardown
└── README.md                             # Quick start guide
```

---

## 📌 Section 4: The 9-Step Live Demo Flow (Exactly Matches Whitepaper)

Each step maps 1:1 to the whitepaper Section A, Figure 2, and the 9 canonical chaincode transactions:

| Step | Action | Transaction Called | UI Portal | What Judges See |
|:---:|---|---|---|---|
| **1** | Register patient with Mock Identity Adapter | `RegisterPatientReference` | Admin Portal | Synthetic patientRefHash generated — hash displayed, never raw NID |
| **2** | Store encrypted FHIR clinical record off-chain | *(Off-chain operation)* | Clinician Portal | AES-256-GCM ciphertext written to encrypted bucket |
| **3** | Anchor record hash on blockchain | `CreateRecordReference` | Clinician Portal | SHA-256 hash visible in Explorer, not data |
| **4** | Patient grants scoped consent (7-day, treatment) | `GrantConsent` | Patient Portal | Consent with scope [AllergyIntolerance, MedicationRequest], purpose=treatment, expiry=7d |
| **5** | Authorized clinician retrieves record | `RequestAccess` → `LogAccess` | Clinician Portal | Gateway decrypts & returns FHIR bundle; access event logged on-chain |
| **6** | Patient revokes consent; next access fails | `RevokeConsent` | Patient Portal | Subsequent RequestAccess returns `CONSENT_REVOKED` error |
| **7** | Emergency break-glass access (60 min, with reason) | `InvokeEmergencyAccess` | Emergency Portal | MFA + reasonCode + scope + 60-min timer visible |
| **8** | Auditor reviews emergency access event | `ReviewEmergencyAccess` | Auditor Portal | Marks APPROPRIATE or INAPPROPRIATE with audit hash |
| **9** | View complete immutable audit trail | `GetHistoryForKey` (query) | Patient + Auditor | Full chronological history from ledger |

> **Critical Rule:** Every step emits a chaincode event visible in the UI. If consent is expired, revoked, or scope-exceeded, the demo **fails visibly** — this proves real enforcement, not a scripted video.

---

## 📌 Section 5: Chaincode Design (Go — 9 Canonical Transactions)

### 5.1 On-Chain Data Structures

```go
type PatientReference struct {
    PatientRefHash string `json:"patientRefHash"`   // SALTED_SHA256(syntheticId+dob)
    HomeOrg        string `json:"homeOrg"`           // Org1MSP or Org2MSP
    CreatedAt      string `json:"createdAt"`
    Active         bool   `json:"active"`
}

type RecordReference struct {
    RecordID          string `json:"recordId"`
    PatientRefHash    string `json:"patientRefHash"`
    RecordType        string `json:"recordType"`       // Coarse: "AllergyIntolerance"
    RecordHash        string `json:"recordHash"`       // SHA256(ciphertext)
    OpaquePointerHash string `json:"opaquePointerHash"` // SHA256(storage pointer)
    CustodialOrg      string `json:"custodialOrg"`
    Provenance        string `json:"provenance"`
    CreatedAt         string `json:"createdAt"`
}

type Consent struct {
    ConsentID      string   `json:"consentId"`
    PatientRefHash string   `json:"patientRefHash"`
    Grantee        string   `json:"grantee"`
    Scope          []string `json:"scope"`             // ["AllergyIntolerance","MedicationRequest"]
    Purpose        string   `json:"purpose"`           // treatment|emergency|audit|research-opt-in
    ExpiryTimestamp string  `json:"expiryTimestamp"`
    Revoked        bool     `json:"revoked"`
    PatientSig     string   `json:"patientSig"`
    CreatedAt      string   `json:"createdAt"`
}

type EmergencyAccessEvent struct {
    EmergencyID    string   `json:"emergencyId"`
    PatientRefHash string   `json:"patientRefHash"`
    AccessorHash   string   `json:"accessorHash"`
    ReasonCode     string   `json:"reasonCode"`
    Scope          []string `json:"scope"`
    ExpiryTimestamp string  `json:"expiryTimestamp"`
    ReviewStatus   string   `json:"reviewStatus"`      // PENDING|APPROPRIATE|INAPPROPRIATE
    ReviewerHash   string   `json:"reviewerHash"`
    FindingsHash   string   `json:"findingsHash"`
}
```

### 5.2 Validation Rules (Every Transaction)

1. **MSP/OU Check** — Caller's X.509 certificate must contain correct OU attribute
2. **Scope Allowlist** — Only permitted FHIR resource types (no wildcard `*`)
3. **Purpose Allowlist** — Only `treatment`, `emergency`, `audit`, `research-opt-in`
4. **Expiry Enforcement** — Expired consents fail closed
5. **Revocation Check** — Revoked consents immediately block access
6. **ReasonCode Allowlist** — Emergency access requires valid clinical reason
7. **Zero PII Guard** — Reject any transient/state data containing raw identifiers

---

## 📌 Section 6: API Endpoints (12 REST Routes)

| Method | Path | Auth | Chaincode | Response |
|---|---|---|---|---|
| POST | `/patients/register` | Gateway + Admin | `RegisterPatientReference` | `201 {patientRefHash}` |
| POST | `/providers/register` | OU=Admin | `RegisterProvider` | `201 {providerIdHash}` |
| POST | `/records` | OU=Clinician | `CreateRecordReference` | `201 {recordId, recordHash}` |
| GET | `/records/:id` | OU=Clinician/Emergency | `RequestAccess` → `LogAccess` | `200 FHIR bundle` or `403` |
| POST | `/consents` | Patient sig | `GrantConsent` | `201 {consentId}` |
| DELETE | `/consents/:id` | Patient sig | `RevokeConsent` | `200 {revoked: true}` |
| POST | `/access/request` | Clinician cert | `RequestAccess` | `200 {granted}` or `403` |
| POST | `/emergency/invoke` | OU=Emergency + MFA | `InvokeEmergencyAccess` | `201 {emergencyId}` |
| POST | `/emergency/review` | OU=Auditor | `ReviewEmergencyAccess` | `200 {reviewed}` |
| GET | `/audit/:patientRefHash` | Patient / Auditor | `GetHistoryForKey` | `200 [{events}]` |
| GET | `/health` | Public | — | `200 {status, peers, blocks}` |
| GET | `/network/status` | Admin | — | `200 {orgs, channels}` |

---

## 📌 Section 7: Development Phases & Timeline (12 Days)

### Phase 1: Blockchain Network (Days 1–3)

| Task | Owner | Duration | Deliverable |
|---|---|---|---|
| Set up Docker Compose for 4-org Fabric network | Abeer | Day 1 | `docker-compose.yaml`, crypto generation |
| Create channel `medralink-main` & join all peers | Abeer | Day 1 | Channel operational, peers synced |
| Write Go chaincode (9 transactions + models + validation) | Abeer + Abdali | Days 1–3 | `medralink-cc` compiled & unit tested |
| Deploy chaincode lifecycle (install → approve → commit) | Abeer | Day 3 | Chaincode active on all endorsing peers |
| Set up Hyperledger Explorer | Abdali | Day 3 | Explorer dashboard showing blocks/txns |

### Phase 2: Backend API Gateway (Days 3–5)

| Task | Owner | Duration | Deliverable |
|---|---|---|---|
| Initialize Node.js + Express project | Abdali | Day 3 | Project scaffold with Fabric SDK connected |
| Implement 12 REST API routes | Abdali | Days 3–5 | All endpoints functional |
| Build encryption service (AES-256-GCM) | Abdali | Day 4 | FHIR bundle encrypt/decrypt operational |
| Build mock identity adapter | Abdali | Day 4 | Synthetic Health IDs generated |
| Build FHIR bundle generator (synthetic data) | Sumaia | Day 4 | AllergyIntolerance + MedicationRequest bundles |
| JWT + role-based auth middleware | Abdali | Day 5 | Role enforcement across all routes |

### Phase 3: Frontend React Portals & Visual Branding (Days 4–8)

| Task | Owner | Duration | Deliverable |
|---|---|---|---|
| Scaffold React + Vite project, routing, auth context | Sumaia | Day 4 | App shell with role-based routing |
| Generate visual branding assets (Logo & BD Health Card) | Sumaia | Day 4 | `medralink_logo.jpg`, `bangladesh_health_card_mockup.jpg` |
| Login page with demo user quick-select | Sumaia | Day 5 | 5 demo users selectable by role |
| Patient Portal (Dashboard, Consent Manager, Audit, Health Card Mockup) | Sumaia | Days 5–6 | Consent grant/revoke + audit timeline + smart card preview |
| Clinician Portal (Access Request, Record Viewer) | Sumaia | Days 6–7 | FHIR record display with consent check |
| Emergency Portal (Break-Glass Form, Timer) | Sumaia | Day 7 | MFA + reasonCode + countdown timer |
| Auditor Portal (Review Panel, Explorer embed) | Sumaia | Day 7–8 | Emergency review + block explorer |
| Admin Panel (Provider/Patient registration) | Sumaia | Day 8 | Registration flows + network status |

---

## 📌 Section 7.5: Visual Branding, Identity Artifacts & Medical Record Imagery

To ensure a compelling demonstration for BCOLBD 2026 evaluators, the prototype incorporates dedicated branding and medical context imagery:

| Asset | Location | Resolution / Format | Visual Role & Context |
|---|---|:---:|---|
| **MedraLink Master Logo** | `assets/branding/medralink_logo.jpg` | 1024×1024 JPG | Glowing cyan/teal medical cross merged with cryptographic shield and decentralized nodes. Used in Navbar, Header, and Pitch Deck. |
| **Bangladesh Digital Health Card Mockup** | `assets/branding/bangladesh_health_card_mockup.jpg` | 1920×1080 JPG | Photorealistic National Healthcare Interoperability Card with Bangladesh Govt seal, biometric microchip, QR ledger proof, and pseudonymous `patientRefHash`. Rendered inside Patient Portal. |
| **Layered Architecture Diagram (Fig 1)** | `assets/diagrams/Medralink_Layered_Architecture.png` | 3000×1950 PNG (300 DPI) | Layer 1–4 system topology (Portals → FHIR Gateway → Fabric Network → Off-Chain Custodial Storage). |
| **Consent Transaction Flow (Fig 2)** | `assets/diagrams/Medralink_Consent_Transaction_Flow.png` | 3000×2400 PNG (300 DPI) | Complete 9-step consent lifecycle and on-chain / off-chain separation flow. |
| **Emergency Break-Glass Sequence (Fig 3)** | `assets/diagrams/Medralink_Emergency_Access_Sequence.png` | 3000×1800 PNG (300 DPI) | 60-min time-boxed emergency invocation with mandatory auditor review loop. |
| **Consortium Governance Triad (Fig 4)** | `assets/diagrams/Medralink_Governance_Model.png` | 3000×1800 PNG (300 DPI) | 3-Pillar Governance (Network Membership, Business Network, Tech Infrastructure). |


### Phase 4: Integration & Testing (Days 8–10)

| Task | Owner | Duration | Deliverable |
|---|---|---|---|
| End-to-end 9-step demo flow testing | All | Day 8–9 | All 9 steps pass sequentially |
| Edge case testing (expired, revoked, wrong scope) | Abeer + Abdali | Day 9 | Errors surface correctly in UI |
| Record 10-min demo video | All | Day 10 | MP4 prototype demo video |

### Phase 5: Deployment & Submission (Days 10–12)

| Task | Owner | Duration | Deliverable |
|---|---|---|---|
| Deploy to Oracle Cloud VM (Always Free) | Abeer | Day 10 | Full stack running on cloud |
| Frontend deploy to Vercel/Netlify | Sumaia | Day 10 | Public URL for React SPA |
| Final submission package preparation | All | Days 11–12 | All deliverables ready |

---

## 📌 Section 8: Deployment (Oracle Cloud Always Free)

### Resource Requirements

| Component | CPU | RAM | Disk | Port |
|---|---|---|---|---|
| Fabric Peers (4) | 1.0 core | 4 GB | 2 GB | 7051-7054 |
| Fabric Orderers (3) | 0.5 core | 2 GB | 1 GB | 7050 |
| Fabric CAs (4) | 0.2 core | 1 GB | 0.5 GB | 7054-7057 |
| CouchDB (4) | 0.3 core | 2 GB | 1 GB | 5984-5987 |
| API Gateway | 0.5 core | 1 GB | 0.5 GB | 3001 |
| Explorer | 0.3 core | 1 GB | 0.5 GB | 8080 |
| Frontend (dev) | 0.2 core | 0.5 GB | 0.2 GB | 5173 |
| **TOTAL** | **~3.0 cores** | **~11.5 GB** | **~5.7 GB** | — |

> ✅ Fits within Oracle Cloud Always Free (4 ARM cores + 24 GB RAM).

---

## 📌 Section 9: What Judges See vs. What Remains Mocked

| Component | Status | Detail |
|---|:---:|---|
| **Web UI (5 portals)** | ✅ **REAL** | Fully functional Patient, Clinician, Emergency, Auditor, Admin portals |
| **Fabric Network** | ✅ **REAL** | Running peers, orderers, CAs, CouchDB in Docker Compose |
| **Chaincode writes** | ✅ **REAL** | All 9 transactions execute genuine ledger writes visible in Explorer |
| **Consent → Access → Revoke loop** | ✅ **REAL** | End-to-end on-chain enforcement; failures are real |
| **Emergency break-glass** | ✅ **REAL** | Time-boxed, reason-coded, audit-reviewed on-chain events |
| **Block Explorer** | ✅ **REAL** | Hyperledger Explorer showing blocks, transactions, chaincode events |
| **Encryption (AES-256-GCM)** | ✅ **REAL** | FHIR bundles encrypted/decrypted at gateway; hashes on-chain |
| **FHIR bundles** | ⚠️ **SYNTHETIC** | Pre-generated AllergyIntolerance + MedicationRequest |
| **Identity verification (NID/e-KYC)** | ⚠️ **MOCK** | Mock adapter returns synthetic Health IDs |
| **SMS/email notifications** | ⚠️ **MOCK** | In-app banners + console logs only |
| **Facial liveness check** | ⚠️ **MOCK** | Placeholder checkbox in MFA flow |
| **SHR/OpenHIE integration** | ⚠️ **STUB** | Stub endpoint simulating SHR API response |

> All mocked components display **"SYNTHETIC DATA — MOCK ADAPTER"** banners in the UI.

---

## 📌 Section 10: Self-Evaluation Against BCOLBD Prototype Rubric

### Iteration 1 — Initial Draft

| Criterion | Max | Score | Band | Gap Identified |
|---|:---:|:---:|---|---|
| Problem & Solution | 40 | 35 | Very Good | Need "why not just a database" moment in demo |
| Privacy & Security | 20 | 17 | Very Good | Key management demo could be more visible |
| Architecture | 20 | 17 | Very Good | On-chain/off-chain split not clear enough in UI |
| Governance | 20 | 15 | Very Good | Governance dashboard could be stronger |
| **TOTAL** | **100** | **84** | **Very Good** | |

### Iteration 2 — Fixes Applied

| Gap | Fix | Score Impact |
|---|---|:---:|
| "Why not DB" unclear | Add Step 0: Show centralized failure scenario before blockchain demo | +2 |
| Key management not visible | Add "Encryption Details" panel showing key info (not revealing key) | +1 |
| On/off-chain split unclear | Add split-view: left = on-chain hash, right = off-chain FHIR content | +2 |
| Governance weak | Add governance overview page with org membership, policy display | +1 |

### Iteration 3 — Final Refined Score

| Criterion | Max | Final Score | Band |
|---|:---:|:---:|---|
| Problem & Solution | 40 | **37** | **Excellent** |
| Privacy & Security | 20 | **18** | **Excellent** |
| Architecture | 20 | **19** | **Excellent** |
| Governance | 20 | **16** | **Very Good** |
| **TOTAL** | **100** | **90** | **Excellent** |

> **Projected prototype score: 90/100 (Excellent).** Combined with whitepaper 93.5/100 = strong finalist.

---

## 📌 Section 11: Team Task Ownership

| Team Member | Primary | Secondary | Skills |
|---|---|---|---|
| **Kazi Md Azhar Uddin Abeer** (Lead) | Blockchain Network + Chaincode (Go) | Cloud deploy, DevOps | Fabric, Go, Docker, Linux |
| **Ahmad Abdali Khan** | Backend API (Node.js) | Encryption, testing, Explorer | Node.js, Express, Fabric SDK |
| **Sumaia Bintey Ismail** | Frontend React Portals | FHIR data, demo video, UI/UX | React, CSS, Design, Docs |

### Cross-Training Safety Net
- Abeer ↔ Abdali: Both can debug chaincode and API issues
- Abdali ↔ Sumaia: Both can work on API-to-frontend integration
- Sumaia ↔ Abeer: Both understand demo flow and can present

---

## 📌 Section 12: Pre-Submission Checklist

### Prototype Readiness
- [ ] Fabric network bootstraps with one command (`make setup`)
- [ ] All 9 chaincode transactions pass unit tests
- [ ] All 12 API endpoints return correct responses
- [ ] All 5 UI portals render and function correctly
- [ ] 9-step demo flow completes end-to-end without errors
- [ ] Hyperledger Explorer shows blocks, transactions, events
- [ ] Edge cases work: expired → denied, revoked → denied, wrong scope → denied
- [ ] "SYNTHETIC DATA — MOCK ADAPTER" banners visible on all screens
- [ ] Demo video recorded (≤10 minutes, MP4 format)

### BCOLBD Final Round Deliverables
- [ ] Updated whitepaper (if revisions needed)
- [ ] Poster board (14400×10800 px, landscape, 300 DPI)
- [ ] Pitch deck (PDF, 16:9)
- [ ] Pitch video (≤10 minutes, MP4, English)
- [ ] Prototype demo video (≤10 minutes, MP4)
- [ ] Live prototype accessible (cloud URL or local Docker)

---

## 📌 Section 13: Quick Start Commands

```bash
# Clone repository
git clone https://github.com/team-medralink/medralink-prototype.git
cd medralink-prototype

# Full setup (one command)
make setup

# Individual components
make network        # Start Fabric network only
make chaincode      # Deploy chaincode
make api            # Start API gateway
make frontend       # Start React dev server
make explorer       # Start Hyperledger Explorer

# Demo & testing
make demo           # Run automated 9-step demo
make test           # Run all tests
make teardown       # Clean shutdown
```

---

> **This plan is execution-ready.** Every component uses free/open-source tools, maps directly to the whitepaper specifications, and targets the BCOLBD prototype rubric for maximum scoring.
