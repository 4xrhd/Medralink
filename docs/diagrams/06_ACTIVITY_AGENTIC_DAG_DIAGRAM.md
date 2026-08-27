# 06 — MedraLink UML Activity Diagram: Multi-Agent DAG Workflow Execution

This document models the Directed Acyclic Graph (DAG) workflow scheduling, parallel agent execution, and blockchain state settlement handled by `MedraLinkOrchestrator`.

---

## 📊 UML Activity Diagram (Mermaid)

```mermaid
flowchart TD
    Start([Start Clinical Intake Event]) --> DAG_Planner[MedraLinkOrchestrator: Build DAG Execution Plan]

    subgraph Step1["Step 1: Terminology & Data Transformation"]
        RawClinicalNotes[Raw Unstructured Clinical Notes / Lab Feed]
        DAG_Planner --> FHIRAgent[🤖 FHIRAgent: Semantic Normalization]
        RawClinicalNotes --> FHIRAgent
        FHIRAgent --> Bindings[Extract SNOMED-CT / LOINC / RxNorm Codes]
        Bindings --> BuildBundle[Construct 6-Resource HL7 FHIR R4 Bundle]
    end

    subgraph Step2["Step 2: Cryptographic Envelope & Policy Verification"]
        BuildBundle --> Fork((Fork Concurrent Checks))
        Fork --> EncryptService[🔒 EncryptionService: AES-256-GCM Envelope Encryption]
        Fork --> ConsentAgent[🤖 ConsentAgent: Dynamic PDPO 2025 Policy Evaluator]
        
        EncryptService --> GenDEK[Generate DEK & Compute recordHash = SHA256 Ciphertext]
        ConsentAgent --> CheckRules{Validate Active Consent, Temporal Bounds & Scope}
    end

    CheckRules -- Violates Policy --> Deny[⛔ Access Denied / Fail-Closed Gate]
    Deny --> EndFail([End Workflow with Access Logged])

    CheckRules -- Compliant --> Join((Join Verification))
    GenDEK --> Join

    subgraph Step3["Step 3: Off-Chain Storage & On-Chain Settlement"]
        Join --> UploadVault[Upload Ciphertext to Hospital Vault s3://vault/rec.enc]
        UploadVault --> AnchorLedger[⛓️ Fabric Settlement: CreateRecordReference recordId, recordHash]
        AnchorLedger --> AuditTrigger[🤖 AuditAgent: Trigger Asynchronous SIEM Anomaly Scan]
    end

    AuditTrigger --> EndSuccess([Intake Completed Successfully with Cryptographic Receipt])
```

---

## 📋 PlantUML Source Code (`activity_dag.puml`)

```plantuml
@startuml
skinparam activity {
  BackgroundColor #F8FAFC
  BorderColor #0F2A44
  ArrowColor #0D9488
}

start
:Client triggers DAG Workflow Pipeline\n[e.g. CLINICAL_INTAKE_AND_RECORD_ANCHOR];

:MedraLinkOrchestrator initializes DAG plan\nand allocates Working Session Memory;

partition "Stage 1: Semantic Normalization" {
  :FHIRAgent parses clinical observations and medications;
  :Map raw terms to SNOMED-CT, LOINC, and RxNorm ontologies;
  :Assemble validated HL7 FHIR R4 Bundle;
}

fork
  partition "Stage 2A: Cryptographic Envelope" {
    :Generate AES-256 Data Encryption Key (DEK);
    :Encrypt FHIR bundle with AES-256-GCM;
    :Compute recordHash = SHA256(Ciphertext);
  }
fork again
  partition "Stage 2B: Dynamic Consent Policy" {
    :ConsentAgent queries Fabric World State;
    :Assert temporal validity (currentTime < expiry);
    :Assert purpose binding and clinical scope allowlist;
  }
end fork

if (Consent Policy Satisfied?) then (yes)
  partition "Stage 3: Off-Chain & On-Chain Settlement" {
    :Upload ciphertext payload to custodial hospital repository;
    :Anchor RecordReference(recordId, recordHash) to Hyperledger Fabric;
    :Emit RecordAnchored chaincode event to SSE stream;
    :AuditAgent checks hash continuity and updates audit baseline;
  }
  :Return 200 OK + Cryptographic Transaction Receipt;
  stop
else (no)
  :Log Access Violation (FAIL_CLOSED) on Ledger;
  :Emit life-safety alert or rejection OperationOutcome;
  stop
endif
@enduml
```
