# MedraLink REST API Gateway Reference & Specification

**Base URL:** `http://localhost:3001`  
**Protocol:** `HTTP/1.1 REST` + `Server-Sent Events (SSE)` + `HL7 FHIR R4 JSON`  
**Authentication & RBAC:** `x-user-role` / `x-demo-role` HTTP Header (`Admin`, `Clinician`, `Emergency`, `Auditor`, `Patient`)  
**Error Standard:** HL7 FHIR `OperationOutcome` with descriptive plain English explanations and recommended corrective actions.

---

## 🔒 Role-Based Access Control (RBAC) Headers

All requests evaluate the caller's X.509 Organizational Unit identity via the `x-user-role` header:

| Header Value | Authenticated Actor | Organization MSP | Permitted Endpoint Scope |
|---|---|---|---|
| `Admin` | System Administrator | `Org1MSP` | Patient registration, provider registration, consortium bootstrap |
| `Clinician` | Dr. Hasan Mahmud | `Org1MSP` | Record creation (AES-256-GCM), consent-gated record retrieval |
| `Emergency` | Dr. Nusrat Alam | `Org2MSP` | 60-min Break-glass emergency invocation |
| `Auditor` | DGHS Compliance Officer | `OrgAuditorMSP` | Post-hoc emergency review, forensic block exploration |
| `Patient` | Rahim Chowdhury (Owner) | `Org1MSP` | Issue consent, revoke consent, direct health vault access |

---

## 🌐 Endpoints Catalog

### 1. System Health & Real-Time Telemetry

#### `GET /health`
Returns gateway status, uptime, and current blockchain ledger block height.
- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "service": "medralink-api-gateway",
    "version": "1.0.0",
    "blockHeight": 10,
    "timestamp": "2026-08-28T02:20:00.000Z"
  }
  ```

#### `GET /status`
Returns 4-organization consortium topology, consensus algorithm, and channel details.

#### `GET /events`
Opens a persistent Server-Sent Events (SSE) stream for real-time ledger block commitments, transaction receipts, and audit notifications. Includes 30-second keep-alive heartbeats.

#### `POST /demo/bootstrap`
One-click automated consortium initialization. Seeds synthetic patients, registered providers, custodial FHIR records, active consents, and emergency events.

---

### 2. Patient Identity Reference Management

#### `POST /patients/register`
Onboards a patient via the Mock Identity Verification Adapter without storing raw PII on-chain.
- **Required Role:** `Admin`
- **Request Body:**
  ```json
  {
    "syntheticId": "BD-HEALTH-994821",
    "dob": "1992-05-14",
    "homeOrg": "Org1MSP"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "SUCCESS",
    "patientRefHash": "c7e9a8b1d2f4567890abcdef1234567890abcdef1234567890abcdef12345678",
    "homeOrg": "Org1MSP",
    "txId": "0x4a7e88219...",
    "blockNumber": 1
  }
  ```

#### `GET /patients/:patientRefHash`
Queries on-chain patient reference state and registered metadata.

---

### 3. Provider Credential Registration

#### `POST /providers/register`
Anchors authorized healthcare provider X.509 cryptographic credentials.
- **Required Role:** `Admin`
- **Request Body:**
  ```json
  {
    "providerId": "DR_HASAN_CLINICIAN",
    "org": "Org1MSP",
    "role": "Clinician"
  }
  ```

---

### 4. Custodial Clinical Records (Off-Chain AES-256-GCM + On-Chain Anchors)

#### `POST /records`
Creates a standardized HL7 FHIR R4 Bundle, encrypts it with AES-256-GCM off-chain, and anchors the cryptographic `recordHash` to the ledger (`CreateRecordReference`).
- **Required Role:** `Clinician`
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1d2f4...",
    "recordType": "AllergyIntolerance",
    "clinicalData": { "substance": "Penicillin", "criticality": "high" }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "SUCCESS",
    "recordId": "rec-8821-uuid",
    "recordHash": "a3f5e189...",
    "custodialOrg": "Org1MSP",
    "txId": "0x992b...",
    "blockNumber": 3
  }
  ```

#### `GET /records/:id?consentId=...&purpose=treatment`
Verifies on-chain consent validity, verifies ciphertext SHA-256 integrity against the ledger anchor, decrypts the FHIR Bundle, and logs the access attempt permanently (`LogAccess`).
- **Required Role:** `Clinician` or `Patient`

---

### 5. Granular Consent Token Lifecycle

#### `POST /consents`
Patient grants a granular, purpose-bound, and time-boxed consent token (`GrantConsent`).
- **Required Role:** `Patient`
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1d2f4...",
    "grantee": "DR_HASAN_CLINICIAN",
    "scope": ["AllergyIntolerance", "MedicationRequest", "Condition"],
    "purpose": "treatment",
    "expiryDays": 7
  }
  ```

#### `DELETE /consents/:id`
Patient immediately revokes an active consent token on-chain (`RevokeConsent`), forcing fail-closed access rejection.
- **Required Role:** `Patient`

---

### 6. Emergency Break-Glass & Post-Hoc Audit

#### `POST /emergency/invoke`
Emergency clinician invokes a 60-minute time-boxed emergency break-glass override under life-safety protocols (`InvokeEmergencyAccess`).
- **Required Role:** `Emergency`
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1d2f4...",
    "reasonCode": "UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS",
    "scope": ["AllergyIntolerance", "MedicationRequest"],
    "expiryMinutes": 60
  }
  ```

#### `POST /emergency/review`
Licensed DGHS auditor reviews an emergency break-glass invocation post-hoc (`ReviewEmergencyAccess`).
- **Required Role:** `Auditor`
- **Request Body:**
  ```json
  {
    "emergencyId": "emg-9941-uuid",
    "reviewStatus": "APPROPRIATE",
    "findingsNote": "Clinical anaphylaxis protocol confirmed by hospital triage sheet."
  }
  ```

---

### 7. Agentic AI Multi-Agent Studio & DAG Engine

#### `GET /agents/status`
Returns active status, role definitions, and capabilities of all 5 autonomous AI agents (`ConsentAgent`, `FHIRAgent`, `EmergencyTriageAgent`, `AuditAgent`, `MedraLinkOrchestrator`).

#### `GET /agents/ontology`
Returns medical ontology reference mappings (SNOMED-CT, LOINC, RxNorm).

#### `POST /agents/orchestrate`
Dispatches multi-agent DAG workflow pipelines (`CLINICAL_INTAKE_AND_RECORD_ANCHOR`, `EMERGENCY_TRAUMA_BREAK_GLASS`, `FORENSIC_COMPLIANCE_SCAN`) across the 3-Tier Memory Hierarchy.

#### `POST /agents/fhir-normalize`
Semantic normalization sandbox mapping raw clinical text to standard HL7 FHIR R4 resources.

#### `POST /agents/consent-evaluate`
Evaluates dynamic PDPO 2025 consent compliance, purpose-binding, and temporal validity.

#### `POST /agents/emergency-triage`
Evaluates trauma vitals (GCS, MAP, Shock Index) and issues a 60-minute emergency break-glass token.

#### `POST /agents/audit-scan`
Executes forensic ledger scans to verify hash continuity and detect credential sharing anomalies.
