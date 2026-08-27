# 02 — MedraLink UML Class & Data Model Diagram

This document models the on-chain Hyperledger Fabric state structures, the off-chain FHIR R4 clinical entities, and their domain relationships.

---

## 📊 UML Class Diagram (Mermaid)

```mermaid
classDiagram
    class PatientReference {
        +string docType
        +string patientRefHash
        +string homeOrg
        +string createdAt
        +bool active
    }

    class ProviderReference {
        +string docType
        +string providerIdHash
        +string org
        +string role
        +string certSerial
        +string createdAt
        +bool active
    }

    class RecordReference {
        +string docType
        +string recordId
        +string patientRefHash
        +string recordHash
        +string fhirResourceType
        +string custodialOrg
        +string storagePointer
        +string createdAt
    }

    class Consent {
        +string docType
        +string consentId
        +string patientRefHash
        +string grantee
        +string[] scope
        +string purpose
        +string expiryTimestamp
        +string status
        +string createdAt
        +string revokedAt
    }

    class AccessEvent {
        +string docType
        +string logId
        +string requestId
        +string providerId
        +string patientRefHash
        +string recordId
        +string timestamp
        +string status
        +string purpose
        +string txId
        +int blockNumber
    }

    class EmergencyAccessEvent {
        +string docType
        +string emergencyId
        +string clinicianId
        +string patientRefHash
        +string reasonCode
        +string[] scope
        +string expiryTimestamp
        +string status
        +string reviewStatus
        +string auditorId
        +string findingsHash
        +string timestamp
    }

    class EncryptedFHIRBundle {
        +string iv
        +string authTag
        +string encryptedData
        +string keyId
        +string recordHash
    }

    PatientReference "1" <-- "*" RecordReference : anchors
    PatientReference "1" <-- "*" Consent : grants
    ProviderReference "1" <-- "*" Consent : receives
    RecordReference "1" <-- "1" EncryptedFHIRBundle : off-chain link
    PatientReference "1" <-- "*" AccessEvent : tracks
    PatientReference "1" <-- "*" EmergencyAccessEvent : triggers
```

---

## 📋 PlantUML Source Code (`class_diagram.puml`)

```plantuml
@startuml
skinparam classAttributeIconSize 0

package "On-Chain Blockchain State (Hyperledger Fabric 2.5)" {
  class PatientReference {
    + docType : string = "PatientReference"
    + patientRefHash : string {SHA-256}
    + homeOrg : string
    + createdAt : string
    + active : boolean
  }

  class ProviderReference {
    + docType : string = "ProviderReference"
    + providerIdHash : string {SHA-256}
    + org : string
    + role : string
    + certSerial : string
    + createdAt : string
    + active : boolean
  }

  class RecordReference {
    + docType : string = "RecordReference"
    + recordId : string {UUIDv4}
    + patientRefHash : string
    + recordHash : string {SHA-256}
    + fhirResourceType : string
    + custodialOrg : string
    + storagePointer : string
    + createdAt : string
  }

  class Consent {
    + docType : string = "Consent"
    + consentId : string {UUIDv4}
    + patientRefHash : string
    + grantee : string
    + scope : string[]
    + purpose : string
    + expiryTimestamp : string
    + status : string
    + createdAt : string
    + revokedAt : string
  }

  class AccessEvent {
    + docType : string = "AccessEvent"
    + logId : string {UUIDv4}
    + requestId : string
    + providerId : string
    + patientRefHash : string
    + recordId : string
    + timestamp : string
    + status : string
    + purpose : string
    + txId : string
    + blockNumber : int
  }

  class EmergencyAccessEvent {
    + docType : string = "EmergencyAccessEvent"
    + emergencyId : string {UUIDv4}
    + clinicianId : string
    + patientRefHash : string
    + reasonCode : string
    + scope : string[]
    + expiryTimestamp : string
    + status : string
    + reviewStatus : string
    + auditorId : string
    + findingsHash : string
    + timestamp : string
  }
}

package "Off-Chain Custodial Storage (AES-256-GCM Encrypted Vault)" {
  class EncryptedFHIRBundle {
    + iv : string {12 bytes Hex}
    + authTag : string {16 bytes Hex}
    + encryptedData : string {Base64}
    + keyId : string
    + recordHash : string
  }
}

PatientReference "1" o-- "0..*" RecordReference : indexed by patientRefHash
PatientReference "1" o-- "0..*" Consent : grants
ProviderReference "1" <-- "0..*" Consent : grantee
RecordReference "1" <..> "1" EncryptedFHIRBundle : cryptographic proof anchor
PatientReference "1" o-- "0..*" AccessEvent : immutable audit trail
PatientReference "1" o-- "0..*" EmergencyAccessEvent : break-glass override log
@enduml
```
