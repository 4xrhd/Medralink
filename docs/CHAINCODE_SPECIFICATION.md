# MedraLink — Chaincode Contract Specification & X-Ray Blueprint

**Contract Package:** `medralink-cc`  
**Language:** Go (v1.22+)  
**Framework:** `github.com/hyperledger/fabric-contract-api-go/v2`  
**Channel:** `medralink-main`  
**Master Agent Manual:** [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)  
**AI Architecture Reference:** [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)  
**Standard:** 9 Canonical Transactions (Whitepaper Table 9 & Section G3)  

---

## 1. 🔬 Chaincode State Machine & Transaction X-Ray Graph

```
                                  ┌─────────────────────────────┐
                                  │   RegisterPatientReference  │
                                  │ (patientRefHash, homeOrg)   │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
                   ▼                             ▼                             ▼
    ┌─────────────────────────────┐┌───────────────────────────┐┌─────────────────────────────┐
    │    CreateRecordReference    ││       GrantConsent        ││    InvokeEmergencyAccess    │
    │  (recordHash, pointerHash)  ││ (grantee, scope, purpose) ││ (60-min Break-Glass Token)  │
    └──────────────┬──────────────┘└─────────────┬─────────────┘└──────────────┬──────────────┘
                   │                             │                             │
                   │                             ▼                             │
                   │              ┌─────────────────────────────┐              │
                   │              │        RevokeConsent        │              │
                   │              │(Immediate Fail-Closed State)│              │
                   │              └──────────────┬──────────────┘              │
                   │                             │                             │
                   ▼                             ▼                             ▼
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                         RequestAccess & Dynamic Policy Guard                            │
    │               - Consent Active & Valid ➔ GRANTED (LogAccess)                            │
    │               - Consent Expired / Revoked / Scope Mismatch ➔ DENIED (LogAccess)          │
    │               - Emergency Active Token ➔ GRANTED_EMERGENCY (LogAccess)                  │
    └────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    ReviewEmergencyAccess    │
                                  │(DGHS Auditor Forensic Review│
                                  │   APPROPRIATE/INAPPROPRIATE)│
                                  └─────────────────────────────┘
```

---

## 2. 🌳 Composite Key Trie & State Indexing X-Ray

```
WORLD STATE STORE (CouchDB / LevelDB)
├── <patientRefHash> ──────────────────────➔ PatientReference Object
├── PROV_<providerIdHash> ─────────────────➔ ProviderReference Object
├── REC_<recordId> ────────────────────────➔ RecordReference Object
├── CONSENT_<consentId> ───────────────────➔ Consent Object
├── AUDIT_<requestId> ─────────────────────➔ AccessEvent Object
├── EMERGENCY_<emergencyId> ───────────────➔ EmergencyAccessEvent Object
│
└── SECONDARY COMPOSITE KEY TRIES:
    ├── patient~record
    │   └── \x00patient~record\x00<patientRefHash>\x00<recordId>\x00 ➔ \x00
    │
    ├── patient~consent
    │   └── \x00patient~consent\x00<patientRefHash>\x00<consentId>\x00 ➔ \x00
    │
    ├── patient~audit
    │   └── \x00patient~audit\x00<patientRefHash>\x00<requestId>\x00 ➔ \x00
    │
    └── patient~emergency
        └── \x00patient~emergency\x00<patientRefHash>\x00<emergencyId>\x00 ➔ \x00
```

---

## 3. Canonical Transaction Signatures

| # | Transaction Name | Primary Actor | Invocation Path | Event Emitted |
|---|---|---|---|---|
| 1 | `RegisterPatientReference` | Identity Adapter / Gateway | `POST /patients/register` | `PatientRegistered` |
| 2 | `RegisterProvider` | Hospital Administrator | `POST /providers/register` | `ProviderRegistered` |
| 3 | `CreateRecordReference` | Authorized Clinician | `POST /records` | `RecordCreated` |
| 4 | `GrantConsent` | Patient App | `POST /consents` | `ConsentGranted` |
| 5 | `RevokeConsent` | Patient App | `DELETE /consents/:id` | `ConsentRevoked` |
| 6 | `RequestAccess` | Authorized Clinician | `POST /access/request` | `AccessRequested` |
| 7 | `LogAccess` | API Gateway | Auto-invoked upon access attempt | `AccessLogged` |
| 8 | `InvokeEmergencyAccess` | Emergency Clinician | `POST /emergency/invoke` | `EmergencyAccessInvoked` |
| 9 | `ReviewEmergencyAccess` | Network Auditor | `POST /emergency/review` | `EmergencyAccessReviewed` |

---

## 4. Detailed Transaction Specifications

### 4.1 `RegisterPatientReference`
- **Signature:** `RegisterPatientReference(ctx, patientRefHash string, homeOrg string, createdAt string) (*PatientReference, error)`
- **Caller Requirement:** Gateway Certificate + Admin Attestation (`OU=Admin` or `OU=Client`).
- **Validation Rules:**
  1. `patientRefHash` must not already exist in World State.
  2. `AssertZeroPII`: Input cannot contain raw 10-, 13-, or 17-digit national identity numbers.
- **State Writes:** Key `<patientRefHash>`, Value: `PatientReference` JSON.
- **Event:** `PatientRegistered`.

### 4.2 `RegisterProvider`
- **Signature:** `RegisterProvider(ctx, providerIDHash string, org string, role string, certSerial string, createdAt string) (*ProviderReference, error)`
- **Caller Requirement:** `OU=Admin` of the target MSP.
- **Validation Rules:** Valid SHA-256 hash, permitted roles (`Clinician`, `Emergency`, `Admin`, `Auditor`).
- **State Writes:** Key `PROV_<providerIDHash>`, Value: `ProviderReference` JSON.
- **Event:** `ProviderRegistered`.

### 4.3 `CreateRecordReference`
- **Signature:** `CreateRecordReference(ctx, recordID string, patientRefHash string, recordType string, recordHash string, opaquePointerHash string, custodialOrg string, provenance string, createdAt string) (*RecordReference, error)`
- **Caller Requirement:** `OU=Clinician` + Endorsement from custodial hospital organization.
- **Validation Rules:** Verified patient existence, valid FHIR scope resource type, Zero-PII assertions.
- **State Writes:** Key `REC_<recordID>` and Composite Key `patient~record`.
- **Event:** `RecordCreated`.

### 4.4 `GrantConsent`
- **Signature:** `GrantConsent(ctx, consentID string, patientRefHash string, grantee string, scopeJSON string, purpose string, expiryTimestamp string, patientSig string, createdAt string) (*Consent, error)`
- **Caller Requirement:** Patient App digital signature.
- **Validation Rules:** Granular scopes (no wildcards `*`), valid ISO8601/RFC3339 timestamp, approved purpose code.
- **State Writes:** Key `CONSENT_<consentID>` and Composite Key `patient~consent`.
- **Event:** `ConsentGranted`.

### 4.5 `RevokeConsent`
- **Signature:** `RevokeConsent(ctx, consentID string, patientRefHash string, patientSig string) (*Consent, error)`
- **Caller Requirement:** Patient reference match.
- **Validation Rules:** Asserts consent exists, matches patient, and is not already revoked.
- **State Writes:** Sets `revoked = true` under `CONSENT_<consentID>`.
- **Event:** `ConsentRevoked`.

### 4.6 `RequestAccess`
- **Signature:** `RequestAccess(ctx, requestID string, patientRefHash string, consentID string, accessorHash string, scope string, purpose string) (*AccessVerificationResult, error)`
- **Caller Requirement:** Authorized clinician credentials.
- **Validation Rules:** Dynamic verification of patient ownership, revocation flag, expiration time, scope allowlist, and purpose alignment.
- **Event:** `AccessRequested`.

### 4.7 `LogAccess`
- **Signature:** `LogAccess(ctx, requestID string, patientRefHash string, accessorHash string, scope string, purpose string, status string, timestamp string) (*AccessEvent, error)`
- **State Writes:** Key `AUDIT_<requestID>` and Composite Key `patient~audit`.
- **Event:** `AccessLogged`.

### 4.8 `InvokeEmergencyAccess`
- **Signature:** `InvokeEmergencyAccess(ctx, emergencyID string, clinicianIDHash string, patientRefHash string, reasonCode string, scopeJSON string, expiryTimestamp string, createdAt string) (*EmergencyAccessEvent, error)`
- **Caller Requirement:** Emergency department physician credentials (`OU=Emergency`).
- **Validation Rules:** Valid emergency reason code, granular scopes, valid expiration timestamp.
- **State Writes:** Key `EMERGENCY_<emergencyID>`, Composite Key `patient~emergency`, and audit entry `AUDIT_EMG_<emergencyID>`.
- **Event:** `EmergencyAccessInvoked`.

### 4.9 `ReviewEmergencyAccess`
- **Signature:** `ReviewEmergencyAccess(ctx, emergencyID string, auditorIDHash string, reviewStatus string, findingsHash string, reviewedAt string) (*EmergencyAccessEvent, error)`
- **Caller Requirement:** Licensed compliance auditor (`OU=Auditor`, `OrgAuditorMSP`).
- **Validation Rules:** Review status must be `APPROPRIATE` or `INAPPROPRIATE`.
- **State Writes:** Updates review state under `EMERGENCY_<emergencyID>`.
- **Event:** `EmergencyAccessReviewed`.

---

## 5. Query Methods

* `GetPatientReference(ctx, patientRefHash)`
* `GetRecordReference(ctx, recordID)`
* `GetConsent(ctx, consentID)`
* `GetEmergencyEvent(ctx, emergencyID)`
* `GetAccessHistory(ctx, patientRefHash)`: Uses `patient~audit` composite index.
* `GetRecordsForPatient(ctx, patientRefHash)`: Uses `patient~record` composite index.
* `GetConsentsForPatient(ctx, patientRefHash)`: Uses `patient~consent` composite index.
* `GetEmergencyEventsForPatient(ctx, patientRefHash)`: Uses `patient~emergency` composite index.

---

## 6. 🔗 Reference Connections

* Master Agent Architecture & Guidelines: [`AGENTS.md`](file:///home/tr/Downloads/MedraLink/AGENTS.md)
* Agentic AI Architecture: [`AGENTIC_AI_ARCHITECTURE.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/AGENTIC_AI_ARCHITECTURE.md)
* System Architecture Specification: [`ARCHITECTURE_SPECIFICATION.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/ARCHITECTURE_SPECIFICATION.md)
* Testing and QA Report: [`TESTING_AND_QA_REPORT.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/TESTING_AND_QA_REPORT.md)
