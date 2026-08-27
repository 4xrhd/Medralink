# MedraLink — HL7 FHIR R4 Interoperability, Semantic Normalization & Encryption Guide

**Standard Version:** HL7 FHIR Release 4 (R4)  
**Encryption Standard:** AES-256-GCM (Authenticated Encryption with Associated Data)  
**Terminology Standard:** SNOMED-CT, LOINC, RxNorm, ICD-10  
**National Integration Target:** DGHS Shared Health Record (SHR) & OpenMRS+  
**Master Agent Manual:** [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)  
**AI Architecture Reference:** [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)  

---

## 1. Overview & Semantic Interoperability Philosophy

MedraLink is designed to be **SHR-compatible, not SHR-competitive**. Rather than replacing existing hospital Electronic Medical Record (EMR) databases or the DGHS Shared Health Record exchange, MedraLink serves as the **decentralized trust, consent, and immutable provenance layer**.

The **`FHIRAgent`** semantic normalization engine ingests unstructured physician notes, prescription forms, and legacy diagnostic outputs, binding them to international medical terminologies and generating standardized **HL7 FHIR R4 Bundles**.

---

## 2. 🔬 FHIR Normalization & Cryptographic Envelope X-Ray

```
[ UNSTRUCTURED CLINICAL NARRATIVE / LAB FEED ]
                      │
                      ▼ (FHIRAgent Semantic Extraction)
┌─────────────────────────────────────────────────────────────┐
│                 ONTOLOGY BINDING ENGINE                     │
│  - SNOMED-CT: 373270004 (Penicillin), 39579001 (Anaphylaxis)│
│  - LOINC: 1558-6 (Fasting Glucose), 4548-4 (HbA1c)          │
│  - RxNorm: 860975 (Metformin 500mg), 312961 (Amlodipine 5mg)│
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 HL7 FHIR R4 BUNDLE (JSON)                   │
│   ├── Patient Resource (Pseudonymized RefHash)              │
│   ├── AllergyIntolerance Resource (Criticality: High)       │
│   ├── MedicationRequest Resource (Active Status)            │
│   └── DiagnosticReport Resource (Status: Final)             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼ (AES-256-GCM Envelope Encryption)
┌─────────────────────────────────────────────────────────────┐
│                  ENCRYPTED STORAGE OBJECT                   │
│  - Ciphertext: 68a7f9c2e4b1...                              │
│  - Initialization Vector (IV): 12-byte random               │
│  - Authentication Tag: 16-byte GCM Poly1305 Tag             │
│  - recordHash = SHA256(Ciphertext)                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
(Custodial Off-Chain Storage)      (CreateRecordReference)
s3://hospital-vault/rec-01.enc     Hyperledger Fabric Ledger
```

---

## 3. Supported FHIR R4 Clinical Resources

### 3.1 `AllergyIntolerance` (Critical Patient Safety)
- **Use Case:** High-criticality drug and food allergies (e.g. Severe Penicillin Anaphylaxis).
- **Terminology Binding:** SNOMED-CT (e.g. `373270004` — Penicillin structure, `39579001` — Anaphylaxis).
- **Structure:**
  ```json
  {
    "resourceType": "AllergyIntolerance",
    "id": "allergy-001",
    "clinicalStatus": {
      "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active" }]
    },
    "criticality": "high",
    "code": {
      "coding": [{ "system": "http://snomed.info/sct", "code": "373270004", "display": "Penicillin" }],
      "text": "Penicillin (Severe Anaphylaxis Risk)"
    },
    "reaction": [{
      "manifestation": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "39579001", "display": "Anaphylaxis" }] }],
      "severity": "severe"
    }]
  }
  ```

---

### 3.2 `MedicationRequest` (Active Pharmacotherapy)
- **Use Case:** Prescriptions and long-term medication management.
- **Terminology Binding:** RxNorm (e.g. `860975` — Metformin hydrochloride 500 MG).
- **Structure:**
  ```json
  {
    "resourceType": "MedicationRequest",
    "id": "med-001",
    "status": "active",
    "intent": "order",
    "medicationCodeableConcept": {
      "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975", "display": "Metformin 500mg" }],
      "text": "Metformin 500mg daily"
    }
  }
  ```

---

### 3.3 `DiagnosticReport` (Laboratory and Diagnostic Results)
- **Use Case:** Blood chemistry, pathology, radiology summaries.
- **Terminology Binding:** LOINC (e.g. `1558-6` — Fasting Blood Glucose).
- **Structure:**
  ```json
  {
    "resourceType": "DiagnosticReport",
    "id": "diag-001",
    "status": "final",
    "code": {
      "coding": [{ "system": "http://loinc.org", "code": "1558-6", "display": "Fasting Glucose" }]
    },
    "conclusion": "Elevated fasting blood sugar (7.8 mmol/L). Consistent with mild diabetes mellitus."
  }
  ```

---

## 4. Encryption & Key Management (AES-256-GCM)

1. **Envelope Encryption:** Each clinical resource bundle is encrypted under an ephemeral 256-bit Data Encryption Key (DEK).
2. **Authenticated Encryption (GCM):** The 128-bit authentication tag detects any bit-level tampering in custodial storage.
3. **Ledger Integrity Anchor:** The SHA-256 hash of the ciphertext (`recordHash`) is committed on-chain. Before decryption, the client asserts:
   $$\text{SHA256}(\text{StoredCiphertext}) == \text{OnChainRecordHash}$$

---

## 5. 🔗 Reference Connections

* Master Agent Architecture & Guidelines: [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)
* Agentic AI Architecture: [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)
* System Architecture Specification: [`ARCHITECTURE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/ARCHITECTURE_SPECIFICATION.md)
* REST API Reference: [`API_REFERENCE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/API_REFERENCE.md)
