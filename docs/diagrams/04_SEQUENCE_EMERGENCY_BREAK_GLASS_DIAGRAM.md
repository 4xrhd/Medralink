# 04 — MedraLink UML Sequence Diagram: Emergency Break-Glass & Post-Hoc Audit

This document models the life-safety emergency break-glass sequence, triage agent validation, 60-minute token dispensation, and post-hoc DGHS auditor review.

---

## 📊 UML Sequence Diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor ER as 🚨 Emergency Doctor
    participant Gateway as 🌐 API Gateway
    participant Triage as 🤖 EmergencyTriageAgent
    participant Fabric as ⛓️ Hyperledger Fabric
    actor Auditor as 🛡️ DGHS Compliance Auditor
    participant AuditAgent as 🤖 AuditAgent

    Note over ER: Unconscious Trauma Patient Arrives
    ER->>Gateway: POST /emergency/invoke<br/>{patientRefHash, reasonCode, vitals, GCS: 7, MAP: 55}
    Gateway->>Triage: evaluateEmergencyProtocol(vitals, reasonCode, clinicianMfa)

    Triage->>Triage: Calculate Shock Index (HR/SBP) & GCS (7 < 8 = ESI Level 1)
    Triage-->>Gateway: EMERGENCY_VALIDATED (Issue 60-Min Token)

    Gateway->>Fabric: InvokeEmergencyAccess(emergencyId, clinicianId, patientRef, reasonCode, 60min)
    Fabric-->>Gateway: State Committed: EMERGENCY_{id} [PENDING_REVIEW]
    Gateway-->>ER: 201 Created (60-min Break-Glass Token + Emergency Allergy Summary)

    Note over ER: Emergency Resuscitation Complete (60 mins pass)

    Note over Auditor, AuditAgent: Post-Hoc Regulatory Audit Cycle
    AuditAgent->>Fabric: Scan Ledger Blocks for PENDING_REVIEW Emergency Events
    Fabric-->>AuditAgent: Return emergencyId, reasonCode, vitals payload
    AuditAgent->>AuditAgent: Cross-reference hospital ESI logs & trauma admission registry
    AuditAgent-->>Auditor: Flag Dossier with Evidence Findings

    Auditor->>Gateway: POST /emergency/review<br/>{emergencyId, reviewStatus: "APPROPRIATE", findingsNote: "..."}
    Gateway->>Fabric: ReviewEmergencyAccess(emergencyId, auditorId, APPROPRIATE, findingsHash)
    Fabric-->>Gateway: State Committed: EMERGENCY_{id} [REVIEWED]
    Gateway-->>Auditor: 200 OK (Cryptographic Non-Repudiation Audit Receipt)
```

---

## 📋 PlantUML Source Code (`sequence_emergency.puml`)

```plantuml
@startuml
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center

actor "Emergency Clinician\n(Trauma ED)" as ER
participant "REST Gateway" as Gateway
participant "EmergencyTriageAgent" as Triage
participant "Hyperledger Fabric\nLedger" as Fabric
participant "AuditAgent\n(Forensic Scanner)" as Scanner
actor "DGHS Auditor\n(Compliance)" as Auditor

== Phase 1: Pre-Authorized Break-Glass Invocation ==
ER -> Gateway : POST /emergency/invoke\n{patientRef, reasonCode="UNCONSCIOUS_TRAUMA", vitals}
activate Gateway

Gateway -> Triage : evaluateEmergencyTriage(vitals, reasonCode)
activate Triage
note over Triage : Evaluate Glasgow Coma Scale (GCS <= 8)\nVerify Mean Arterial Pressure (MAP < 65)\nAssert ESI Level 1 Critical Protocol
Triage --> Gateway : Token Dispensed [60-minute Expiry]
deactivate Triage

Gateway -> Fabric : InvokeEmergencyAccess(emergencyId, clinicianId, patientRef, reasonCode, expiry)
activate Fabric
Fabric --> Gateway : State: EMERGENCY_{id} [Status: PENDING_REVIEW]
deactivate Fabric

Gateway --> ER : 201 Created [Break-Glass Token + Allergy Intolerance Alert]
deactivate Gateway

== Phase 2: Post-Hoc Compliance Forensic Audit ==
Scanner -> Fabric : Parse Blocks for PENDING_REVIEW Events
activate Scanner
activate Fabric
Fabric --> Scanner : Unreviewed Emergency Records
deactivate Fabric

Scanner -> Scanner : Cross-Verify Hospital EHR SIEM Feeds
Scanner --> Auditor : Present Forensic Dossier & Recommendation
deactivate Scanner

Auditor -> Gateway : POST /emergency/review\n{emergencyId, reviewStatus="APPROPRIATE", findings}
activate Gateway

Gateway -> Fabric : ReviewEmergencyAccess(emergencyId, auditorId, status, findingsHash)
activate Fabric
Fabric --> Gateway : State: EMERGENCY_{id} [Status: REVIEWED, reviewStatus: APPROPRIATE]
deactivate Fabric

Gateway --> Auditor : 200 OK [Immutable Regulatory Audit Receipt]
deactivate Gateway

@enduml
```
