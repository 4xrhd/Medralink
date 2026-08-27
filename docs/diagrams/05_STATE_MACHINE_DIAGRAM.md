# 05 — MedraLink UML State Machine Diagram: Consent & Emergency Lifecycles

This document models the lifecycle states, transitions, guard conditions, and fail-closed termination of Consent Tokens and Emergency Break-Glass events on the Hyperledger Fabric ledger.

---

## 📊 1. Consent Token State Machine (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Patient Selects Scope & Grantee

    DRAFT --> ACTIVE : GrantConsent(consentId, patientRef, grantee, scope, purpose, expiry)
    
    state ACTIVE {
        [*] --> VERIFIED : Access Request Received
        VERIFIED --> DECRYPT_ALLOWED : Grantee == Requester && Purpose Valid && Time < Expiry
        VERIFIED --> ACCESS_DENIED : Grantee Mismatch || Purpose Mismatch
        ACCESS_DENIED --> [*] : LogAccess(DENIED)
        DECRYPT_ALLOWED --> [*] : LogAccess(GRANTED)
    }

    ACTIVE --> EXPIRED : CurrentTime > ExpiryTimestamp [Temporal Invariant]
    ACTIVE --> REVOKED : RevokeConsent(consentId) by Patient [PDPO 2025 Right to Revoke]

    EXPIRED --> [*] : Terminal Fail-Closed (No Decryption)
    REVOKED --> [*] : Terminal Fail-Closed (No Decryption)
```

---

## 📊 2. Emergency Break-Glass State Machine (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> INITIATED : Trauma Patient Admitted (GCS <= 8)

    INITIATED --> ACTIVE_60MIN : InvokeEmergencyAccess(emergencyId, reasonCode, vitals)
    
    state ACTIVE_60MIN {
        [*] --> EMERGENCY_UNLOCKED : Emergency Clinician Reads Allergies/Meds
        EMERGENCY_UNLOCKED --> [*]
    }

    ACTIVE_60MIN --> PENDING_REVIEW : 60 Minutes Elapse (Token Expired)
    
    state PENDING_REVIEW {
        [*] --> AUDIT_INVESTIGATION : DGHS Auditor Scans Ledger & EHR Feeds
        AUDIT_INVESTIGATION --> APPROPRIATE : Justified Clinical Indication
        AUDIT_INVESTIGATION --> INAPPROPRIATE : Unjustified Break-Glass Attempt
    }

    APPROPRIATE --> ARCHIVED_CLEARED : ReviewEmergencyAccess(APPROPRIATE, findingsHash)
    INAPPROPRIATE --> DISCIPLINARY_ACTION : ReviewEmergencyAccess(INAPPROPRIATE, findingsHash) -> Flag BMDC

    ARCHIVED_CLEARED --> [*]
    DISCIPLINARY_ACTION --> [*]
```

---

## 📋 PlantUML Source Code (`state_machine.puml`)

```plantuml
@startuml
skinparam state {
  BackgroundColor #F8FAFC
  BorderColor #0F2A44
  ArrowColor #0D9488
}

title MedraLink Consent & Emergency State Machine

state "Consent Token Lifecycle" as ConsentLifecycle {
  [*] --> Active : GrantConsent()\n[Scope, Purpose, Expiry]
  
  Active --> Active : RequestAccess()\n[Valid Grantee & Purpose]
  Active --> Expired : CurrentTime >= ExpiryTimestamp\n[Temporal Guard]
  Active --> Revoked : RevokeConsent()\n[Patient Invocation]
  
  Expired --> [*] : Access Denied\n(Fail-Closed)
  Revoked --> [*] : Access Denied\n(Fail-Closed)
}

state "Emergency Break-Glass Lifecycle" as EmergencyLifecycle {
  [*] --> ActiveEmergency : InvokeEmergencyAccess()\n[ReasonCode, Trauma Vitals]
  
  ActiveEmergency --> PendingReview : 60-Minute Expiry Elapsed
  
  state PendingReview {
    [*] --> AuditorReview
    AuditorReview --> Appropriate : Clinical Protocol Justified
    AuditorReview --> Inappropriate : Unauthorized / Fake Emergency
  }
  
  Appropriate --> ClosedAppropriate : ReviewEmergencyAccess()\n[Findings Hash Anchored]
  Inappropriate --> ClosedSanctioned : Disciplinary Referral to BMDC\n[Regulatory Non-Repudiation]
  
  ClosedAppropriate --> [*]
  ClosedSanctioned --> [*]
}
@enduml
```
