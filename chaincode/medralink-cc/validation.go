package main

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// Permitted Emergency Reason Codes (clinical allowlist)
var validReasonCodes = map[string]bool{
	"UNCONSCIOUS_SUSPECTED_ANAPHYLAXIS": true,
	"TRAUMA_RESUSCITATION":              true,
	"ACUTE_CORONARY_SYNDROME":           true,
	"CARDIAC_ARREST":                    true,
	"STROKE_THROMBOLYSIS_WINDOW":        true,
	"SEVERE_SEPSIS_PROTOCOL":            true,
	"ACUTE_RESPIRATORY_FAILURE":         true,
}

// Permitted FHIR Clinical Resource Types (scope allowlist, wildcards forbidden)
var validScopes = map[string]bool{
	"AllergyIntolerance": true,
	"MedicationRequest":  true,
	"Condition":          true,
	"DiagnosticReport":   true,
	"Encounter":          true,
	"Immunization":       true,
	"Observation":        true,
	"Procedure":          true,
}

// Permitted Purposes for Data Processing (purpose allowlist)
var validPurposes = map[string]bool{
	"treatment":        true,
	"emergency":        true,
	"audit":            true,
	"research-opt-in":  true,
}

// Permitted Emergency Audit Review Statuses
var validReviewStatuses = map[string]bool{
	"APPROPRIATE":   true,
	"INAPPROPRIATE": true,
}

// ValidateReasonCode checks if an emergency break-glass reason is in the approved clinical allowlist
func ValidateReasonCode(reason string) error {
	if !validReasonCodes[reason] {
		return fmt.Errorf("invalid emergency reason code '%s': must be one of approved clinical emergency protocols", reason)
	}
	return nil
}

// ValidateScope checks whether requested scopes contain only allowed FHIR resource types and no wildcards
func ValidateScope(scopes []string) error {
	if len(scopes) == 0 {
		return fmt.Errorf("scope cannot be empty: minimum-necessary granular resources must be specified")
	}
	for _, s := range scopes {
		if s == "*" || strings.Contains(s, "%") || strings.Contains(s, "all") {
			return fmt.Errorf("wildcard scope '%s' is prohibited under PDPO 2025 data minimization principles", s)
		}
		if !validScopes[s] {
			return fmt.Errorf("unsupported scope '%s': must be an approved FHIR R4 clinical resource type", s)
		}
	}
	return nil
}

// ValidatePurpose checks whether the declared purpose is allowed
func ValidatePurpose(purpose string) error {
	if !validPurposes[purpose] {
		return fmt.Errorf("invalid purpose '%s': must be one of [treatment, emergency, audit, research-opt-in]", purpose)
	}
	return nil
}

// ValidateReviewStatus checks if the emergency review status is valid
func ValidateReviewStatus(status string) error {
	if !validReviewStatuses[status] {
		return fmt.Errorf("invalid review status '%s': must be either 'APPROPRIATE' or 'INAPPROPRIATE'", status)
	}
	return nil
}

// ValidateTimestamp checks if a given string is a valid ISO8601/RFC3339 timestamp
func ValidateTimestamp(ts string) (time.Time, error) {
	parsed, err := time.Parse(time.RFC3339, ts)
	if err != nil {
		// Try fallback ISO8601 format
		parsed, err = time.Parse("2006-01-02T15:04:05Z", ts)
		if err != nil {
			return time.Time{}, fmt.Errorf("invalid timestamp format '%s': must be ISO8601/RFC3339", ts)
		}
	}
	return parsed, nil
}

// IsExpired returns true if the expiry timestamp is in the past relative to current time
func IsExpired(expiryStr string, now time.Time) (bool, error) {
	expTime, err := ValidateTimestamp(expiryStr)
	if err != nil {
		return true, err
	}
	return now.After(expTime), nil
}

// rawNIDPattern detects unhashed Bangladesh National ID patterns (10, 13, or 17 digit continuous numbers)
var rawNIDPattern = regexp.MustCompile(`\b\d{10}\b|\b\d{13}\b|\b\d{17}\b`)

// AssertZeroPII ensures no unhashed personal identifier is passed in on-chain arguments
func AssertZeroPII(fields ...string) error {
	for _, f := range fields {
		if rawNIDPattern.MatchString(f) {
			return fmt.Errorf("privacy violation: potential raw national identity number detected in argument. Only cryptographic hashes are permitted on-chain")
		}
	}
	return nil
}
