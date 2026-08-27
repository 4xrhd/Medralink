# MedraLink — Consortium Governance, Security & Regulatory Compliance Manual

**Consortium Model:** 3-Pillar Federated Healthcare Consortium  
**Regulatory Framework:** Bangladesh Personal Data Protection Ordinance (PDPO 2025) & DGHS Interoperability Guidelines  
**Cryptographic Tokenomics:** 100% Tokenless / Zero Cryptocurrency  
**Master Agent Manual:** [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)  
**AI Architecture Reference:** [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)  

---

## 1. 🏛️ The 3-Pillar Governance Triad X-Ray (Figure 4)

MedraLink operates under a decentralized, tri-partite consortium governance structure designed specifically for the pluralistic healthcare ecosystem of Bangladesh:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            MEDRALINK CONSORTIUM GOVERNANCE TRIAD                            │
├─────────────────────────────┬───────────────────────────────┬───────────────────────────────┤
│ 1. NETWORK MEMBERSHIP       │ 2. BUSINESS NETWORK           │ 3. TECHNOLOGY INFRASTRUCTURE  │
├─────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ • DGHS Hospital Vetting     │ • Consent Scope Allowlist     │ • Fabric Chaincode Upgrades   │
│ • MSP CA Identity Issuance  │ • PDPO 2025 Compliance Rules  │ • 3-Node Raft Orderer Cluster │
│ • Certificate Revocations   │ • Dispute Resolution Board    │ • KMS / HSM Hardware Security │
│ • Auditor Read-Only Replicas│ • BMDC Disciplinary Escalation│ • Backup & Peer Telemetry     │
└─────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

---

## 2. 🚨 Emergency Break-Glass Accountability Loop X-Ray

```
┌─────────────────────────┐
│ Acute Trauma Admission  │ (Unconscious Patient / Coma GCS <= 8)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  EmergencyTriageAgent   │ ➔ Validates Reason Code (e.g. UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS)
└───────────┬─────────────┘ ➔ Issues Cryptographic 60-Min Time-Boxed Token
            │
            ▼
┌─────────────────────────┐
│ InvokeEmergencyAccess   │ ➔ Anchored on Fabric Ledger (Event: EmergencyAccessInvoked)
└───────────┬─────────────┘ ➔ Decrypts Critical Life-Safety Allergy & Medication Payload
            │
            ▼
┌─────────────────────────┐
│ Mandatory DGHS Review   │ ➔ DGHS Compliance Auditor inspects clinical justification
└───────────┬─────────────┘
            │
    ┌───────┴─────────────────────────┐
    │                                 │
    ▼ (APPROPRIATE)                   ▼ (INAPPROPRIATE)
[ Justified Life-Safety Care ]   [ BMDC Disciplinary Action & Credential Revocation ]
  Audit Proof Hash Anchored        Immediate Disciplinary Escalation
```

---

## 3. 🛡️ Zero-Token Architecture Rationale

| Evaluation Vector | Speculative Token / Public Blockchain | MedraLink (Tokenless Hyperledger Fabric 2.5) |
|---|---|---|
| **Price Volatility** | Fluctuating gas fees create unpredictable hospital costs | **Zero gas fees**; deterministic operational budgeting |
| **Throughput & Finality** | 7–30 TPS on public chains; probabilistic finality | **>2,000 TPS**; sub-second deterministic Raft finality |
| **Bangladesh Compliance** | Restricted under Bangladesh Bank foreign exchange / crypto bans | **100% compliant** with Bangladesh Bank & ICT Act 2006 |
| **Privacy & Access Control** | Public pseudonymous ledger with global visibility | **Permissioned channels** with cryptographically isolated peers |

---

## 4. 📜 PDPO 2025 Data Sovereign Boundary

1. **Purpose Limitation (Sec 19):** Chaincode strictly validates declared purpose (`treatment`, `emergency`, `audit`) against the patient's consent token.
2. **Data Minimization (Sec 18):** Wildcard queries (`*`) are programmatically blocked. Clinicians receive only the specific FHIR resources authorized.
3. **Emergency Exemption (Sec 24):** Emergency break-glass access is legally protected for life-threatening resuscitation with mandatory 100% post-hoc audit review.
4. **Storage Limitation & Right to Erasure (Sec 21):** No clinical records or PII exist on the ledger. When a patient requests erasure, off-chain ciphertext and DEKs are destroyed at the custodial hospital; the ledger maintains only the historical cryptographic hash as a non-repudiable audit tombstone.

---

## 5. 🔗 Reference Connections

* Master Agent Architecture & Guidelines: [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)
* Agentic AI Architecture: [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)
* System Topology Specification: [`ARCHITECTURE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/ARCHITECTURE_SPECIFICATION.md)
* Canonical Chaincode Specification: [`CHAINCODE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/CHAINCODE_SPECIFICATION.md)
