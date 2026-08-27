package main

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// Unit tests for validators
func TestValidationRules(t *testing.T) {
	// 1. Reason Code Validation
	assert.NoError(t, ValidateReasonCode("UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS"))
	assert.NoError(t, ValidateReasonCode("TRAUMA_RESUSCITATION"))
	assert.NoError(t, ValidateReasonCode("ACUTE_CORONARY_SYNDROME"))
	assert.NoError(t, ValidateReasonCode("CARDIAC_ARREST"))
	assert.NoError(t, ValidateReasonCode("STROKE_THROMBOLYSIS_WINDOW"))
	assert.Error(t, ValidateReasonCode("INVALID_REASON"))

	// 2. Scope Validation
	assert.NoError(t, ValidateScope([]string{"AllergyIntolerance", "MedicationRequest"}))
	assert.NoError(t, ValidateScope([]string{"DiagnosticReport", "Condition", "Observation"}))
	assert.Error(t, ValidateScope([]string{"*"})) // Wildcards strictly forbidden
	assert.Error(t, ValidateScope([]string{"InvalidResource"}))
	assert.Error(t, ValidateScope([]string{}))

	// 3. Purpose Validation
	assert.NoError(t, ValidatePurpose("treatment"))
	assert.NoError(t, ValidatePurpose("emergency"))
	assert.NoError(t, ValidatePurpose("audit"))
	assert.NoError(t, ValidatePurpose("research-opt-in"))
	assert.Error(t, ValidatePurpose("marketing"))
	assert.Error(t, ValidatePurpose("commercial"))

	// 4. Review Status Validation
	assert.NoError(t, ValidateReviewStatus("APPROPRIATE"))
	assert.NoError(t, ValidateReviewStatus("INAPPROPRIATE"))
	assert.Error(t, ValidateReviewStatus("PENDING"))
	assert.Error(t, ValidateReviewStatus("UNKNOWN"))

	// 5. Zero PII Assertion (Detects raw NIDs)
	assert.NoError(t, AssertZeroPII("c5d6e7f8a9b012345678", "Org1MSP"))
	assert.Error(t, AssertZeroPII("19951234567890123")) // 17-digit raw NID detected
	assert.Error(t, AssertZeroPII("1234567890"))        // 10-digit raw NID detected
}

func TestExpiryCheck(t *testing.T) {
	now := time.Now().UTC()
	future := now.Add(24 * time.Hour).Format(time.RFC3339)
	past := now.Add(-24 * time.Hour).Format(time.RFC3339)

	expired, err := IsExpired(future, now)
	assert.NoError(t, err)
	assert.False(t, expired)

	expired, err = IsExpired(past, now)
	assert.NoError(t, err)
	assert.True(t, expired)
}

func TestDataModelSerialization(t *testing.T) {
	// Test PatientReference
	patient := PatientReference{
		DocType:        "PatientReference",
		PatientRefHash: "hash_abc_123",
		HomeOrg:        "Org1MSP",
		CreatedAt:      "2026-08-17T12:00:00Z",
		Active:         true,
	}
	bytes, err := json.Marshal(patient)
	assert.NoError(t, err)
	var recoveredPatient PatientReference
	err = json.Unmarshal(bytes, &recoveredPatient)
	assert.NoError(t, err)
	assert.Equal(t, patient.PatientRefHash, recoveredPatient.PatientRefHash)
	assert.Equal(t, patient.HomeOrg, recoveredPatient.HomeOrg)

	// Test RecordReference
	record := RecordReference{
		DocType:           "RecordReference",
		RecordID:          "rec-001",
		PatientRefHash:    "hash_abc_123",
		RecordType:        "AllergyIntolerance",
		RecordHash:        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		OpaquePointerHash: "f1d2d2f924e986ac86fdf7b36c94bcdf32beec15defc1624ee5143d32b526b41",
		CustodialOrg:      "Org1MSP",
		Provenance:        "Hospital A Pathology Lab",
		CreatedAt:         "2026-08-17T12:00:00Z",
	}
	recBytes, err := json.Marshal(record)
	assert.NoError(t, err)
	var recoveredRecord RecordReference
	err = json.Unmarshal(recBytes, &recoveredRecord)
	assert.NoError(t, err)
	assert.Equal(t, record.RecordID, recoveredRecord.RecordID)
	assert.Equal(t, record.RecordHash, recoveredRecord.RecordHash)

	// Test Consent
	consent := Consent{
		DocType:         "Consent",
		ConsentID:       "con-999",
		PatientRefHash:  "hash_abc_123",
		Grantee:         "DR_HASAN_CLINICIAN",
		Scope:           []string{"AllergyIntolerance", "MedicationRequest"},
		Purpose:         "treatment",
		ExpiryTimestamp: "2026-08-24T12:00:00Z",
		Revoked:         false,
		PatientSig:      "sig_hex_001",
		CreatedAt:       "2026-08-17T12:00:00Z",
	}
	conBytes, err := json.Marshal(consent)
	assert.NoError(t, err)
	var recoveredConsent Consent
	err = json.Unmarshal(conBytes, &recoveredConsent)
	assert.NoError(t, err)
	assert.Equal(t, consent.ConsentID, recoveredConsent.ConsentID)
	assert.False(t, recoveredConsent.Revoked)
	assert.Len(t, recoveredConsent.Scope, 2)

	// Test EmergencyAccessEvent
	emg := EmergencyAccessEvent{
		DocType:         "EmergencyAccessEvent",
		EmergencyID:     "emg-777",
		PatientRefHash:  "hash_abc_123",
		ClinicianIDHash: "clinician_hash_99",
		ReasonCode:      "UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS",
		Scope:           []string{"AllergyIntolerance"},
		ExpiryTimestamp: "2026-08-17T13:00:00Z",
		ReviewStatus:    "PENDING",
		CreatedAt:       "2026-08-17T12:00:00Z",
	}
	emgBytes, err := json.Marshal(emg)
	assert.NoError(t, err)
	var recoveredEmg EmergencyAccessEvent
	err = json.Unmarshal(emgBytes, &recoveredEmg)
	assert.NoError(t, err)
	assert.Equal(t, "PENDING", recoveredEmg.ReviewStatus)

	// Test ProviderReference
	provider := ProviderReference{
		DocType:        "ProviderReference",
		ProviderIDHash: "prov_hash_001",
		Org:            "Org1MSP",
		Role:           "Clinician",
		CertSerial:     "cert_serial_12345",
		Active:         true,
		CreatedAt:      "2026-08-17T12:00:00Z",
	}
	provBytes, err := json.Marshal(provider)
	assert.NoError(t, err)
	var recoveredProv ProviderReference
	err = json.Unmarshal(provBytes, &recoveredProv)
	assert.NoError(t, err)
	assert.Equal(t, "Org1MSP", recoveredProv.Org)
	assert.Equal(t, "Clinician", recoveredProv.Role)

	// Test AccessVerificationResult
	accessRes := AccessVerificationResult{
		Allowed: true,
		Reason:  "valid active consent grant",
		Status:  "GRANTED",
	}
	accBytes, err := json.Marshal(accessRes)
	assert.NoError(t, err)
	var recoveredAccess AccessVerificationResult
	err = json.Unmarshal(accBytes, &recoveredAccess)
	assert.NoError(t, err)
	assert.True(t, recoveredAccess.Allowed)
	assert.Equal(t, "GRANTED", recoveredAccess.Status)
}

func TestCanonicalEvents(t *testing.T) {
	assert.Equal(t, "PatientRegistered", EventPatientRegistered)
	assert.Equal(t, "ProviderRegistered", EventProviderRegistered)
	assert.Equal(t, "RecordCreated", EventRecordCreated)
	assert.Equal(t, "ConsentGranted", EventConsentGranted)
	assert.Equal(t, "ConsentRevoked", EventConsentRevoked)
	assert.Equal(t, "AccessRequested", EventAccessRequested)
	assert.Equal(t, "AccessLogged", EventAccessLogged)
	assert.Equal(t, "EmergencyAccessInvoked", EventEmergencyAccessInvoked)
	assert.Equal(t, "EmergencyAccessReviewed", EventEmergencyAccessReviewed)
}
