# MedraLink — Live Prototype Demonstration Script & X-Ray Execution Pipeline

**Competition:** Blockchain Olympiad Bangladesh (BCOLBD 2026)  
**Track:** Student Category — Blockchain / Agentic AI Track  
**Master Agent Manual:** [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)  
**AI Architecture Reference:** [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)  
**Reference Document:** Whitepaper Section G & Figures 2, 3  

---

## 1. 🔬 9-Stage Live Demonstration Pipeline X-Ray

```
[ Step 1: RegisterPatientReference ] ➔ Pseudonymous Salted Identity (Zero PII on-chain)
                │
                ▼
[ Step 2 & 3: CreateRecordReference ] ➔ FHIR Normalization + AES-256-GCM + recordHash Anchor
                │
                ▼
[ Step 4: GrantConsent ] ➔ Patient App Grants Time-Boxed Scope [Allergy, Medication]
                │
                ▼
[ Step 5: RequestAccess ➔ LogAccess ] ➔ Clinician Retrieval & Client-Side Decryption
                │
                ▼
[ Step 6: RevokeConsent ] ➔ Patient App Revokes Token on Hyperledger Fabric
                │
                ▼
[ Step 7: RequestAccess (Fail-Closed) ] ➔ Access Rejection & Audit Logged (CONSENT_REVOKED)
                │
                ▼
[ Step 8: InvokeEmergencyAccess ] ➔ 60-min Break-Glass Token (PDPO Sec 24 Emergency Life-Safety)
                │
                ▼
[ Step 9: ReviewEmergencyAccess ] ➔ DGHS Auditor Marks APPROPRIATE + Block Audit Verified
```

---

## 2. 📋 The 9-Stage Demonstration Walkthrough

### Step 1: Onboard Patient via Mock Identity Adapter
- **Actor:** Hospital Administrator / Patient App
- **Action:** Submits synthetic Health ID (`BD-HEALTH-994821`) and birthdate (`1992-05-14`).
- **Transaction:** `RegisterPatientReference(patientRefHash, homeOrg)`
- **Ledger Verification:** State `patientRefHash` committed on `Org1MSP` peer. Raw NID is discarded immediately.

### Step 2: Store Encrypted Clinical Record Off-Chain
- **Actor:** Pilot Hospital A (Org1MSP)
- **Action:** `FHIRAgent` normalizes unstructured notes into an HL7 FHIR R4 Bundle containing `AllergyIntolerance` (Penicillin Anaphylaxis) and `MedicationRequest` (Metformin 500mg), encrypted with AES-256-GCM.
- **Result:** Ciphertext saved to custodial repository (`s3://vault/records/<recordId>.enc`).

### Step 3: Anchor Integrity Hash On Blockchain
- **Actor:** Hospital A Peer
- **Action:** Calculates `recordHash = SHA256(ciphertext)` and `opaquePointerHash = SHA256(pointer)`.
- **Transaction:** `CreateRecordReference(recordId, patientRefHash, recordType, recordHash, pointerHash, custodialOrg)`
- **Ledger Verification:** Block explorer shows record reference anchored to block height #2.

### Step 4: Patient Grants Granular Consent
- **Actor:** Patient (via Patient Portal)
- **Action:** Selects Dr. Hasan Mahmud (`DR_HASAN_CLINICIAN`), scope `[AllergyIntolerance, MedicationRequest]`, purpose `treatment`, validity 7 days.
- **Transaction:** `GrantConsent(consentId, patientRefHash, grantee, scope, purpose, expiry)`
- **Ledger Verification:** `Consent` state stored with `revoked = false`.

### Step 5: Authorized Clinician Retrieves & Decrypts Record
- **Actor:** Dr. Hasan Mahmud (Clinician Portal)
- **Action:** Enters patientRefHash and requests clinical record.
- **Transaction:** `RequestAccess` → `LogAccess`
- **Result:** `ConsentAgent` validates active consent, smart contract emits `AccessRequested`, gateway decrypts ciphertext and renders FHIR clinical bundle in the UI.

### Step 6: Patient Revokes Consent
- **Actor:** Patient (Patient Portal)
- **Action:** Clicks "Revoke Consent" on the active consent card.
- **Transaction:** `RevokeConsent(consentId, patientRefHash)`
- **Ledger Verification:** Consent state `revoked = true` anchored on ledger.

### Step 7: Automatic Access Denial (Fail-Closed Proof)
- **Actor:** Clinician
- **Action:** Attempts to retrieve the record again using the same consent token.
- **Result:** `ConsentAgent` and smart contract immediately reject request with status `CONSENT_REVOKED`. The UI displays a red access denial banner, and an unauthorized access attempt is logged on the immutable audit trail.

### Step 8: Controlled Emergency Break-Glass
- **Actor:** Dr. Nusrat Alam (Hospital B Emergency Department)
- **Action:** Trauma patient arrives unconscious with suspected anaphylactic shock. Clinician executes emergency break-glass with reason code `UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS`.
- **Transaction:** `InvokeEmergencyAccess(emergencyId, clinicianIdHash, patientRefHash, reasonCode, scope, expiry)`
- **Result:** `EmergencyTriageAgent` issues a 60-minute time-boxed override token. Critical allergy alert is decrypted in the emergency portal, and high-priority SIEM event is emitted.

### Step 9: Post-Hoc Auditor Review & Block Verification
- **Actor:** DGHS Compliance Auditor (Auditor Console)
- **Action:** Inspects the emergency break-glass event, reviews clinician emergency justification, and submits audit approval.
- **Transaction:** `ReviewEmergencyAccess(emergencyId, auditorIdHash, reviewStatus, findingsHash)`
- **Ledger Verification:** Review state committed on `OrgAuditorMSP`. Complete immutable ledger sequence verified with 100% cryptographic continuity.

---

## 3. 🔗 Reference Connections

* Master Agent Manual: [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)
* Agentic AI Architecture: [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)
* System Topology Specification: [`ARCHITECTURE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/ARCHITECTURE_SPECIFICATION.md)
* Testing & QA Report: [`TESTING_AND_QA_REPORT.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/TESTING_AND_QA_REPORT.md)
