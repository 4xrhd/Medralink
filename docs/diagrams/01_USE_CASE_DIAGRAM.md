# 01 — MedraLink UML Use Case Diagram

This document models the functional requirements, actor boundaries, and system interactions across the MedraLink platform.

---

## 👥 Actors

1. **👤 Patient (Citizen Data Subject):** Governs consent lifecycle, accesses private health records vault, monitors audit access log.
2. **🩺 Authorized Clinician:** Requests consent-gated record access, uploads AES-256-GCM encrypted FHIR bundles, anchors hash proofs.
3. **🚨 Emergency Clinician:** Triggers life-safety emergency break-glass override under time-boxed tokens.
4. **🛡️ DGHS Compliance Auditor:** Performs post-hoc forensic ledger verification, evaluates emergency break-glass justifications, flags disciplinary actions.
5. **⚙️ Consortium Admin:** Registers institutional healthcare providers, onboards pseudonymous patient references, bootstraps consortium state.
6. **🤖 Autonomous AI Agents (`ConsentAgent`, `FHIRAgent`, `EmergencyTriageAgent`, `AuditAgent`, `MedraLinkOrchestrator`):** Automates DAG workflows, policy evaluation, terminology normalization, and anomaly detection.

---

## 📊 UML Use Case Diagram (Mermaid)

```mermaid
graph TD
    subgraph Actors
        Patient["👤 Patient (Citizen)"]
        Clinician["🩺 Authorized Clinician"]
        Emergency["🚨 Emergency Clinician"]
        Auditor["🛡️ DGHS Auditor"]
        Admin["⚙️ Consortium Admin"]
        Agent["🤖 Agentic AI Engine"]
    end

    subgraph "MedraLink Platform Boundaries"
        UC1["UC-01: Onboard Pseudonymous Patient Reference"]
        UC2["UC-02: Grant Granular Scope/Purpose Consent Token"]
        UC3["UC-03: Revoke Consent Token Instantly"]
        UC4["UC-04: View Immutable Patient Audit Trail"]
        UC5["UC-05: Create Encrypted FHIR Clinical Record"]
        UC6["UC-06: Request Consent-Gated Record Decryption"]
        UC7["UC-07: Verify Cryptographic Ciphertext Integrity"]
        UC8["UC-08: Trigger 60-min Emergency Break-Glass"]
        UC9["UC-09: Conduct Post-Hoc Emergency Review"]
        UC10["UC-10: Register Healthcare Provider & X.509 Cert"]
        UC11["UC-11: Execute Agentic Multi-Agent DAG Workflow"]
        UC12["UC-12: Semantic FHIR Ontology Normalization (SNOMED/LOINC)"]
    end

    Patient --> UC2
    Patient --> UC3
    Patient --> UC4
    Patient --> UC6

    Clinician --> UC5
    Clinician --> UC6
    Clinician --> UC7

    Emergency --> UC8

    Auditor --> UC9
    Auditor --> UC4

    Admin --> UC1
    Admin --> UC10

    Agent --> UC11
    Agent --> UC12
    Agent --> UC7
    Agent --> UC9

    UC6 -.->|<<includes>>| UC7
    UC8 -.->|<<triggers>>| UC9
    UC5 -.->|<<uses>>| UC12
```

---

## 📋 PlantUML Source Code (`use_case.puml`)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Patient\n(Citizen)" as Patient
actor "Authorized\nClinician" as Clinician
actor "Emergency\nClinician" as Emergency
actor "DGHS\nAuditor" as Auditor
actor "Consortium\nAdmin" as Admin
actor "Agentic AI\nEngine" as Agent

rectangle "MedraLink Healthcare Interoperability & Audit Platform" {
  usecase "UC-01: Onboard Pseudonymous Patient Ref" as UC1
  usecase "UC-02: Grant Granular Consent Token" as UC2
  usecase "UC-03: Revoke Consent Token" as UC3
  usecase "UC-04: View Immutable Audit Trail" as UC4
  usecase "UC-05: Create Encrypted FHIR Record" as UC5
  usecase "UC-06: Request Consent-Gated Decryption" as UC6
  usecase "UC-07: Verify Ciphertext Integrity Hash" as UC7
  usecase "UC-08: Invoke Emergency Break-Glass" as UC8
  usecase "UC-09: Post-Hoc Emergency Audit Review" as UC9
  usecase "UC-10: Register Healthcare Provider X.509" as UC10
  usecase "UC-11: Orchestrate Multi-Agent DAG Pipeline" as UC11
  usecase "UC-12: Normalize SNOMED/LOINC/RxNorm FHIR" as UC12
}

Patient --> UC2
Patient --> UC3
Patient --> UC4
Patient --> UC6

Clinician --> UC5
Clinician --> UC6
Clinician --> UC7

Emergency --> UC8

Auditor --> UC9
Auditor --> UC4

Admin --> UC1
Admin --> UC10

Agent --> UC11
Agent --> UC12
Agent --> UC7
Agent --> UC9

UC6 ..> UC7 : <<include>>
UC8 ..> UC9 : <<triggers>>
UC5 ..> UC12 : <<include>>
@enduml
```
