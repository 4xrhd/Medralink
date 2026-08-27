# 03 — MedraLink UML Sequence Diagram: Consent-Gated Access & Decryption

This document models the end-to-end flow of dynamic consent policy evaluation, tamper verification, off-chain decryption, and immutable on-chain access logging.

---

## 📊 UML Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor Clinician as 🩺 Clinician (Requester)
    participant Gateway as 🌐 MedraLink API Gateway
    participant ConsentAgent as 🤖 ConsentAgent
    participant Fabric as ⛓️ Hyperledger Fabric (Ledger)
    participant Vault as 🗄️ Custodial Hospital Vault

    Clinician->>Gateway: GET /records/:id?consentId=...&purpose=treatment<br/>(X-User-Role: Clinician)
    Gateway->>ConsentAgent: evaluateConsent(consentId, patientRef, requester, scope, purpose)
    ConsentAgent->>Fabric: Query Consent(consentId) & Provider(requester)
    Fabric-->>ConsentAgent: Consent Record & Provider X.509 Status

    alt Consent Invalid / Expired / Purpose Mismatch
        ConsentAgent-->>Gateway: FAIL_CLOSED (Denied: EXPIRED or SCOPE_MISMATCH)
        Gateway->>Fabric: LogAccess(logId, requestId, requester, recordId, DENIED)
        Gateway-->>Clinician: 403 Forbidden (FHIR OperationOutcome)
    else Consent Valid & Active
        ConsentAgent-->>Gateway: CONSENT_AUTHORIZED (Scope: [AllergyIntolerance, MedicationRequest])
        Gateway->>Fabric: Query RecordReference(recordId)
        Fabric-->>Gateway: recordHash (SHA-256 anchor) & storagePointer

        Gateway->>Vault: Fetch Ciphertext Payload(storagePointer)
        Vault-->>Gateway: Encrypted Ciphertext + IV + AuthTag

        Note over Gateway: Verify SHA-256(ciphertext) == recordHash anchor
        alt Ciphertext Hash Mismatch (Tamper Detected)
            Gateway-->>Clinician: 500 Tamper Integrity Violation
        else Cryptographic Hash Matches
            Note over Gateway: AES-256-GCM Decrypt using Envelope DEK
            Gateway->>Fabric: LogAccess(logId, requestId, requester, recordId, GRANTED)
            Fabric-->>Gateway: Transaction Committed (Block #N)
            Gateway-->>Clinician: 200 OK + Plaintext FHIR R4 Bundle
        end
    end
```

---

## 📋 PlantUML Source Code (`sequence_consent.puml`)

```plantuml
@startuml
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Clinician\n(Doctor)" as Doctor
participant "REST API\nGateway" as Gateway
participant "ConsentAgent\n(Policy Engine)" as Agent
participant "Hyperledger\nFabric 2.5" as Fabric
participant "Hospital\nStorage Vault" as Vault

Doctor -> Gateway : GET /records/{id}?consentId=...&purpose=treatment\n[X-User-Role: Clinician]
activate Gateway

Gateway -> Agent : evaluateConsent(consentId, requester, scope, purpose)
activate Agent

Agent -> Fabric : Query State: CONSENT_{id} & PROV_{requester}
activate Fabric
Fabric --> Agent : Consent Object & Provider Status
deactivate Fabric

alt Consent Revoked / Expired / Scope Mismatch
    Agent --> Gateway : Status: DENIED (FAIL_CLOSED)
    Gateway -> Fabric : LogAccess(logId, requester, recordId, status="DENIED")
    Gateway --> Doctor : 403 Forbidden [FHIR OperationOutcome]
else Consent Valid & Active
    Agent --> Gateway : Status: GRANTED
    deactivate Agent

    Gateway -> Fabric : Query State: REC_{recordId}
    activate Fabric
    Fabric --> Gateway : recordHash {SHA-256 Anchor}, storagePointer
    deactivate Fabric

    Gateway -> Vault : Fetch Ciphertext(storagePointer)
    activate Vault
    Vault --> Gateway : Ciphertext + IV + AuthTag
    deactivate Vault

    note over Gateway : Assert SHA-256(Ciphertext) == recordHash\n(Tamper Proof Check)

    alt Hash Mismatch
        Gateway --> Doctor : 500 Error [Ciphertext Integrity Violation]
    else Hash Validated
        note over Gateway : AES-256-GCM Envelope Decrypt\nProduce HL7 FHIR R4 Bundle
        Gateway -> Fabric : LogAccess(logId, requester, recordId, status="GRANTED")
        activate Fabric
        Fabric --> Gateway : Tx Committed [Block Height #N]
        deactivate Fabric
        Gateway --> Doctor : 200 OK [Decrypted FHIR R4 Bundle]
    end
end

deactivate Gateway
@enduml
```
