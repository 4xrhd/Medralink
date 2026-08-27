# MedraLink — Finalist Presentation & Pitch Defense Playbook

**Competition:** Blockchain Olympiad Bangladesh 2026 (Final Round)  
**Deliverables:** 10-Minute Pitch Video + 10-Minute Live Prototype Demo + Poster Board  
**Target Score:** 90+ / 100 (Finalist Category)  

---

## 1. 10-Minute Prototype Demo Structure (BCOLBD Rubric Target: 40/40)

| Time | Step | Action in Prototype UI | Key Point for Judges |
|---|---|---|---|
| **0:00 – 1:30** | Context & Problem | Show MedraLink landing page & Bangladesh Smart Health Card mockup | 67–74% out-of-pocket spend, fragmented records, zero trust between private clinics |
| **1:30 – 3:00** | Patient Onboarding & Record Encryption | Run Step 1–3 in Demo Tour: Register Patient & create AES-256-GCM record | Zero PII on ledger; SHA-256 ciphertext hash anchored on Hyperledger Fabric |
| **3:00 – 4:45** | Granular Consent & Retrieval | Run Step 4–5 in Demo Tour: Issue 7-day scoped consent; Clinician decrypts FHIR bundle | Data minimization (no wildcards); SNOMED-CT Penicillin allergy & Metformin |
| **4:45 – 6:15** | Consent Revocation & Denial Proof | Run Step 6–7: Revoke consent; show automatic `CONSENT_REVOKED` on-chain block | Automated non-repudiation; fail-closed blockchain enforcement |
| **6:15 – 8:00** | Emergency Break-Glass Workflow | Run Step 8: Emergency clinician executes 60-min break-glass with reason code | Time-boxed emergency protocol; automatic audit event emission |
| **8:00 – 9:15** | Auditor Review & Block Explorer | Run Step 9: Auditor reviews and marks APPROPRIATE; inspect block height & txs | Full consortium accountability; complete tamper-proof audit trail |
| **9:15 – 10:00** | Conclusion & Scalability | Show 4-Org consortium topology and DGHS SHR compatibility | Zero cryptocurrency; pilot-ready for tertiary hospitals in Bangladesh |

---

## 2. Judge Q&A Defense Playbook

### Q1: "Why use a blockchain instead of a centralized DGHS database?"
- **Answer:** *"In Bangladesh's pluralistic health sector, ~5,000 private diagnostic centers and public hospitals operate as competing entities with zero mutual trust. A centralized database creates a single point of failure and makes public institutions custodians of private clinic data. MedraLink's permissioned consortium provides a decentralized trust and audit non-repudiation layer where no single hospital or administrator can tamper with patient consent or erase audit logs, while clinical records remain stored at their custodial hospital repositories."*

### Q2: "How do you ensure patient data privacy under Bangladesh PDPO 2025 and GDPR?"
- **Answer:** *"Zero PII (Personally Identifiable Information) or raw clinical data is ever stored on the blockchain. The ledger only contains salted cryptographic hashes (`patientRefHash`) and ciphertext integrity hashes. Clinical data is encrypted off-chain using AES-256-GCM with per-record Data Encryption Keys (DEKs). When a patient exercises their right to erasure, off-chain keys and ciphertexts are permanently deleted; the ledger retains only the cryptographic hash as a non-repudiable audit tombstone."*

### Q3: "What prevents doctors from abusing the emergency break-glass feature?"
- **Answer:** *"Break-glass access is strictly time-boxed (e.g. 60 minutes) and requires the clinician to specify a valid clinical emergency reason code (e.g. `UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS`) along with an X.509 cryptographic signature. Every break-glass event is permanently logged on the ledger as PENDING review. DGHS network compliance auditors review all emergency events; flagging an event as INAPPROPRIATE triggers disciplinary reporting to the Bangladesh Medical and Dental Council (BMDC)."*

### Q4: "Why did you choose a tokenless Hyperledger Fabric architecture instead of Ethereum/Polygon?"
- **Answer:** *"Public blockchains introduce volatile gas fees, speculative risks, slower transaction finality, and significant regulatory barriers under Bangladesh Bank cryptocurrency guidelines. Hyperledger Fabric delivers >2,000 TPS, sub-second CFT Raft consensus finality, X.509 enterprise identity management, and deterministic zero-gas operational costs essential for public health systems."*
