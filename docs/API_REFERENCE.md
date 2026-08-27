# MedraLink REST API Gateway Reference

Base URL: `http://localhost:3001`  
Protocol: `HTTP/1.1 REST` + `HL7 FHIR R4 JSON`

---

## Endpoints

### 1. Patients

#### `POST /patients/register`
Onboards a patient via the Mock Identity Verification Adapter.
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
    "patientRefHash": "c7e9a8b1d2f4567890abcdef...",
    "homeOrg": "Org1MSP",
    "txId": "0x4a7e...",
    "blockNumber": 1
  }
  ```

#### `GET /patients/:patientRefHash`
Queries on-chain patient reference state.

---

### 2. Clinical Records

#### `POST /records`
Encrypts a FHIR clinical resource off-chain and anchors the cryptographic hash to the ledger.
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1d2f...",
    "recordType": "AllergyIntolerance",
    "clinicalData": { "gender": "male", "birthDate": "1992-05-14" }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "recordId": "uuid-v4",
    "recordHash": "sha256(ciphertext)",
    "opaquePointerHash": "sha256(pointer)",
    "algorithm": "aes-256-gcm",
    "txId": "0x89ab...",
    "blockNumber": 2
  }
  ```

#### `GET /records/:id?consentId=...&purpose=treatment`
Verifies on-chain consent and returns the decrypted HL7 FHIR Bundle.

---

### 3. Consents

#### `POST /consents`
Patient grants granular time-boxed access rights.
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1d2f...",
    "grantee": "DR_HASAN_CLINICIAN",
    "scope": ["AllergyIntolerance", "MedicationRequest"],
    "purpose": "treatment",
    "expiryDays": 7
  }
  ```

#### `DELETE /consents/:id`
Patient revokes an active consent token on-chain.

---

### 4. Emergency Break-Glass

#### `POST /emergency/invoke`
Emergency clinician invokes break-glass access under an approved clinical emergency protocol.
- **Request Body:**
  ```json
  {
    "patientRefHash": "c7e9a8b1...",
    "reasonCode": "UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS",
    "scope": ["AllergyIntolerance", "MedicationRequest"],
    "expiryMinutes": 60
  }
  ```

#### `POST /emergency/review`
Licensed auditor reviews an emergency break-glass event.
- **Request Body:**
  ```json
  {
    "emergencyId": "uuid-v4",
    "reviewStatus": "APPROPRIATE",
    "findingsNote": "Emergency justification verified."
  }
  ```

---

### 5. Audit & Compliance

#### `GET /audit/:patientRefHash`
Returns complete immutable access and emergency event history.

#### `GET /audit/blocks/all`
Returns all mined Hyperledger Fabric blocks and cryptographic transaction receipts.

---

### 6. Agentic AI Multi-Agent Orchestration

#### `GET /agents/status`
Returns status, protocol descriptions, and active state of all 5 autonomous agents (`ConsentAgent`, `FHIRAgent`, `EmergencyTriageAgent`, `AuditAgent`, `MedraLinkOrchestrator`).

#### `GET /agents/ontology`
Returns mapped clinical terminology ontologies (SNOMED-CT, LOINC, RxNorm).

#### `POST /agents/orchestrate`
Master DAG planner executing multi-agent pipelines (`CLINICAL_INTAKE_AND_RECORD_ANCHOR`, `EMERGENCY_TRAUMA_BREAK_GLASS`, `FORENSIC_COMPLIANCE_SCAN`).
- **Request Body:**
  ```json
  {
    "workflowType": "CLINICAL_INTAKE_AND_RECORD_ANCHOR",
    "inputPayload": {
      "patientRefHash": "c7e9a8b1...",
      "rawNotes": "Patient allergic to penicillin taking metformin",
      "clinicianId": "DR-RAHMAN-8821"
    }
  }
  ```

#### `POST /agents/fhir-normalize`
Invokes `FHIRAgent` to extract entities and generate validated HL7 FHIR R4 Bundle.

#### `POST /agents/consent-evaluate`
Invokes `ConsentAgent` to dynamically evaluate PDPO 2025 consent rules, expiration timestamps, and purpose-binding constraints.

#### `POST /agents/emergency-triage`
Invokes `EmergencyTriageAgent` to calculate GCS, MAP, Shock Index, and issue a 60-minute time-boxed break-glass token.

#### `POST /agents/audit-scan`
Invokes `AuditAgent` to execute forensic ledger block scans, check SHA-256 hash continuity, and identify unreviewed break-glass events.
- `GET /health` — API Gateway health and block height.
- `GET /status` — Detailed 4-organization consortium topology status.
