package main

// PatientReference stores pseudonymous on-chain patient references.
// Zero PII (Personally Identifiable Information) or raw clinical data is ever stored on the ledger.
type PatientReference struct {
	DocType        string `json:"docType"`        // "PatientReference"
	PatientRefHash string `json:"patientRefHash"` // SALTED_SHA256(syntheticId + dob)
	HomeOrg        string `json:"homeOrg"`        // e.g., "Org1MSP" or "Org2MSP"
	CreatedAt      string `json:"createdAt"`      // ISO8601 timestamp
	Active         bool   `json:"active"`         // Active status
}

// ProviderReference stores authorized healthcare provider credentials.
type ProviderReference struct {
	DocType        string `json:"docType"`        // "ProviderReference"
	ProviderIDHash string `json:"providerIdHash"` // SHA256(provider institutional ID)
	Org            string `json:"org"`            // e.g., "Org1MSP" (Hospital A)
	Role           string `json:"role"`           // e.g., "Clinician", "Emergency", "Admin"
	CertSerial     string `json:"certSerial"`     // X.509 Certificate Serial Number Hash
	Active         bool   `json:"active"`
	CreatedAt      string `json:"createdAt"`
}

// RecordReference anchors cryptographic integrity and off-chain storage pointer hashes.
type RecordReference struct {
	DocType           string `json:"docType"`           // "RecordReference"
	RecordID          string `json:"recordId"`          // Unique Record UUID
	PatientRefHash    string `json:"patientRefHash"`    // Pseudonymous reference
	RecordType        string `json:"recordType"`        // Coarse type e.g. "AllergyIntolerance", "MedicationRequest"
	RecordHash        string `json:"recordHash"`        // SHA-256 hash of AES-256-GCM ciphertext
	OpaquePointerHash string `json:"opaquePointerHash"` // SHA-256 hash of off-chain storage locator
	CustodialOrg      string `json:"custodialOrg"`      // MSP ID of hospital holding the ciphertext
	Provenance        string `json:"provenance"`        // Creator provider ID hash
	CreatedAt         string `json:"createdAt"`
}

// Consent defines granular, time-boxed patient authorization.
type Consent struct {
	DocType         string   `json:"docType"`         // "Consent"
	ConsentID       string   `json:"consentId"`       // Unique Consent UUID
	PatientRefHash  string   `json:"patientRefHash"`  // Patient granting consent
	Grantee         string   `json:"grantee"`         // Provider ID hash or Organization MSP ID
	Scope           []string `json:"scope"`           // Allowed FHIR resource types (no wildcards)
	Purpose         string   `json:"purpose"`         // "treatment" | "emergency" | "audit" | "research-opt-in"
	ExpiryTimestamp string   `json:"expiryTimestamp"` // ISO8601 timestamp
	Revoked         bool     `json:"revoked"`         // Immediate revocation flag
	PatientSig      string   `json:"patientSig"`      // Cryptographic signature of patient app
	CreatedAt       string   `json:"createdAt"`
}

// AccessEvent records immutable audit logs of clinical data access attempts.
type AccessEvent struct {
	DocType        string `json:"docType"`        // "AccessEvent"
	RequestID      string `json:"requestId"`      // Access Request UUID
	PatientRefHash string `json:"patientRefHash"`
	AccessorHash   string `json:"accessorHash"`   // Provider ID hash
	Scope          string `json:"scope"`          // Accessed resource type
	Purpose        string `json:"purpose"`        // Declared purpose
	Timestamp      string `json:"timestamp"`
	Status         string `json:"status"`         // "GRANTED" | "DENIED" | "CONSENT_REVOKED" | "EXPIRED"
}

// EmergencyAccessEvent records break-glass access with mandatory review workflows.
type EmergencyAccessEvent struct {
	DocType         string   `json:"docType"`         // "EmergencyAccessEvent"
	EmergencyID     string   `json:"emergencyId"`     // Unique Emergency Break-Glass UUID
	PatientRefHash  string   `json:"patientRefHash"`
	ClinicianIDHash string   `json:"clinicianIdHash"` // Emergency clinician ID hash
	ReasonCode      string   `json:"reasonCode"`      // Validated clinical reason code
	Scope           []string `json:"scope"`           // Break-glass requested scope
	ExpiryTimestamp string   `json:"expiryTimestamp"` // Time-boxed grant (e.g. 60 min)
	ReviewStatus    string   `json:"reviewStatus"`    // "PENDING" | "APPROPRIATE" | "INAPPROPRIATE"
	ReviewerHash    string   `json:"reviewerHash"`    // Auditor ID hash
	FindingsHash    string   `json:"findingsHash"`    // Cryptographic proof of audit findings
	CreatedAt       string   `json:"createdAt"`
	ReviewedAt      string   `json:"reviewedAt"`
}

// AccessVerificationResult represents the outcome of an access permission check.
type AccessVerificationResult struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason"`
	Status  string `json:"status"`
}
