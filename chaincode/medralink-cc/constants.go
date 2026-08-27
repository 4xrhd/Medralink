package main

// Document Types
const (
	DocTypePatientReference     = "PatientReference"
	DocTypeProviderReference    = "ProviderReference"
	DocTypeRecordReference      = "RecordReference"
	DocTypeConsent              = "Consent"
	DocTypeAccessEvent          = "AccessEvent"
	DocTypeEmergencyAccessEvent = "EmergencyAccessEvent"
)

// Key Prefixes
const (
	PrefixProvider  = "PROV_"
	PrefixRecord    = "REC_"
	PrefixConsent   = "CONSENT_"
	PrefixAudit     = "AUDIT_"
	PrefixEmergency = "EMERGENCY_"
)

// Composite Index Names
const (
	CompositeKeyPatientRecord    = "patient~record"
	CompositeKeyPatientConsent   = "patient~consent"
	CompositeKeyPatientAudit     = "patient~audit"
	CompositeKeyPatientEmergency = "patient~emergency"
)
