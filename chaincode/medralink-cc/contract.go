package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// MedralinkContract defines the smart contract for MedraLink
type MedralinkContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger with sample bootstrap data if needed
func (c *MedralinkContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("Medralink Smart Contract Initialized Successfully")
	return nil
}

// =========================================================================================
// Canonical Transaction 1: RegisterPatientReference
// =========================================================================================
func (c *MedralinkContract) RegisterPatientReference(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
	homeOrg string,
	createdAt string,
) (*PatientReference, error) {
	if patientRefHash == "" || homeOrg == "" {
		return nil, fmt.Errorf("patientRefHash and homeOrg are required")
	}
	if err := AssertZeroPII(patientRefHash, homeOrg); err != nil {
		return nil, err
	}

	exists, err := ctx.GetStub().GetState(patientRefHash)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists != nil {
		return nil, fmt.Errorf("patient reference '%s' already exists", patientRefHash)
	}

	createdAt = resolveTimestamp(ctx, createdAt)

	patient := &PatientReference{
		DocType:        DocTypePatientReference,
		PatientRefHash: patientRefHash,
		HomeOrg:        homeOrg,
		CreatedAt:      createdAt,
		Active:         true,
	}

	patientJSON, err := json.Marshal(patient)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(patientRefHash, patientJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put patient to world state: %v", err)
	}

	_ = ctx.GetStub().SetEvent(EventPatientRegistered, patientJSON)
	return patient, nil
}

// =========================================================================================
// Canonical Transaction 2: RegisterProvider
// =========================================================================================
func (c *MedralinkContract) RegisterProvider(
	ctx contractapi.TransactionContextInterface,
	providerIDHash string,
	org string,
	role string,
	certSerial string,
	createdAt string,
) (*ProviderReference, error) {
	if providerIDHash == "" || org == "" || role == "" {
		return nil, fmt.Errorf("providerIDHash, org, and role are required")
	}
	if err := AssertZeroPII(providerIDHash, org, role, certSerial); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixProvider, providerIDHash)
	exists, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, fmt.Errorf("failed to read provider state: %v", err)
	}
	if exists != nil {
		return nil, fmt.Errorf("provider '%s' already registered", providerIDHash)
	}

	createdAt = resolveTimestamp(ctx, createdAt)

	provider := &ProviderReference{
		DocType:        DocTypeProviderReference,
		ProviderIDHash: providerIDHash,
		Org:            org,
		Role:           role,
		CertSerial:     certSerial,
		Active:         true,
		CreatedAt:      createdAt,
	}

	providerJSON, err := json.Marshal(provider)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, providerJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put provider state: %v", err)
	}

	_ = ctx.GetStub().SetEvent(EventProviderRegistered, providerJSON)
	return provider, nil
}

// =========================================================================================
// Canonical Transaction 3: CreateRecordReference
// =========================================================================================
func (c *MedralinkContract) CreateRecordReference(
	ctx contractapi.TransactionContextInterface,
	recordID string,
	patientRefHash string,
	recordType string,
	recordHash string,
	opaquePointerHash string,
	custodialOrg string,
	provenance string,
	createdAt string,
) (*RecordReference, error) {
	if recordID == "" || patientRefHash == "" || recordType == "" || recordHash == "" || opaquePointerHash == "" {
		return nil, fmt.Errorf("missing required parameters for record reference")
	}
	if err := AssertZeroPII(recordID, patientRefHash, recordType, recordHash, opaquePointerHash, custodialOrg, provenance); err != nil {
		return nil, err
	}
	if err := ValidateScope([]string{recordType}); err != nil {
		return nil, fmt.Errorf("invalid recordType: %v", err)
	}

	// Verify patient exists
	patientBytes, err := ctx.GetStub().GetState(patientRefHash)
	if err != nil || patientBytes == nil {
		return nil, fmt.Errorf("patient reference '%s' does not exist on-chain", patientRefHash)
	}

	key := fmt.Sprintf("%s%s", PrefixRecord, recordID)
	exists, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if exists != nil {
		return nil, fmt.Errorf("record ID '%s' already exists", recordID)
	}

	createdAt = resolveTimestamp(ctx, createdAt)

	record := &RecordReference{
		DocType:           DocTypeRecordReference,
		RecordID:          recordID,
		PatientRefHash:    patientRefHash,
		RecordType:        recordType,
		RecordHash:        recordHash,
		OpaquePointerHash: opaquePointerHash,
		CustodialOrg:      custodialOrg,
		Provenance:        provenance,
		CreatedAt:         createdAt,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, recordJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put record reference: %v", err)
	}

	// Secondary composite index for querying patient records
	indexKey, err := ctx.GetStub().CreateCompositeKey(CompositeKeyPatientRecord, []string{patientRefHash, recordID})
	if err == nil {
		_ = ctx.GetStub().PutState(indexKey, []byte{0x00})
	}

	_ = ctx.GetStub().SetEvent(EventRecordCreated, recordJSON)
	return record, nil
}

// =========================================================================================
// Canonical Transaction 4: GrantConsent
// =========================================================================================
func (c *MedralinkContract) GrantConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	patientRefHash string,
	grantee string,
	scopeJSON string,
	purpose string,
	expiryTimestamp string,
	patientSig string,
	createdAt string,
) (*Consent, error) {
	if consentID == "" || patientRefHash == "" || grantee == "" || scopeJSON == "" || purpose == "" || expiryTimestamp == "" {
		return nil, fmt.Errorf("missing required consent fields")
	}

	var scopes []string
	if err := json.Unmarshal([]byte(scopeJSON), &scopes); err != nil {
		return nil, fmt.Errorf("invalid scopeJSON format: %v", err)
	}
	if err := ValidateScope(scopes); err != nil {
		return nil, err
	}
	if err := ValidatePurpose(purpose); err != nil {
		return nil, err
	}
	if _, err := ValidateTimestamp(expiryTimestamp); err != nil {
		return nil, err
	}
	if err := AssertZeroPII(consentID, patientRefHash, grantee, purpose, expiryTimestamp, patientSig); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixConsent, consentID)
	exists, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if exists != nil {
		return nil, fmt.Errorf("consent ID '%s' already exists", consentID)
	}

	createdAt = resolveTimestamp(ctx, createdAt)

	consent := &Consent{
		DocType:         DocTypeConsent,
		ConsentID:       consentID,
		PatientRefHash:  patientRefHash,
		Grantee:         grantee,
		Scope:           scopes,
		Purpose:         purpose,
		ExpiryTimestamp: expiryTimestamp,
		Revoked:         false,
		PatientSig:      patientSig,
		CreatedAt:       createdAt,
	}

	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, consentJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to save consent: %v", err)
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(CompositeKeyPatientConsent, []string{patientRefHash, consentID})
	if err == nil {
		_ = ctx.GetStub().PutState(indexKey, []byte{0x00})
	}

	_ = ctx.GetStub().SetEvent(EventConsentGranted, consentJSON)
	return consent, nil
}

// =========================================================================================
// Canonical Transaction 5: RevokeConsent
// =========================================================================================
func (c *MedralinkContract) RevokeConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	patientRefHash string,
	patientSig string,
) (*Consent, error) {
	if consentID == "" || patientRefHash == "" {
		return nil, fmt.Errorf("consentID and patientRefHash are required")
	}

	key := fmt.Sprintf("%s%s", PrefixConsent, consentID)
	consentBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if consentBytes == nil {
		return nil, fmt.Errorf("consent ID '%s' does not exist", consentID)
	}

	var consent Consent
	if err := json.Unmarshal(consentBytes, &consent); err != nil {
		return nil, err
	}

	if consent.PatientRefHash != patientRefHash {
		return nil, fmt.Errorf("unauthorized: consent belongs to a different patient reference")
	}
	if consent.Revoked {
		return nil, fmt.Errorf("consent '%s' is already revoked", consentID)
	}

	consent.Revoked = true
	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, consentJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update revoked consent state: %v", err)
	}

	_ = ctx.GetStub().SetEvent(EventConsentRevoked, consentJSON)
	return &consent, nil
}

// =========================================================================================
// Canonical Transaction 6: RequestAccess
// =========================================================================================
func (c *MedralinkContract) RequestAccess(
	ctx contractapi.TransactionContextInterface,
	requestID string,
	patientRefHash string,
	consentID string,
	accessorHash string,
	scope string,
	purpose string,
) (*AccessVerificationResult, error) {
	if requestID == "" || patientRefHash == "" || consentID == "" || accessorHash == "" || scope == "" {
		return nil, fmt.Errorf("missing required request access parameters")
	}
	if err := AssertZeroPII(requestID, patientRefHash, consentID, accessorHash, scope, purpose); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixConsent, consentID)
	consentBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if consentBytes == nil {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("consent '%s' not found", consentID),
			Status:  "DENIED",
		}, nil
	}

	var consent Consent
	if err := json.Unmarshal(consentBytes, &consent); err != nil {
		return nil, err
	}

	// 1. Check patient ownership
	if consent.PatientRefHash != patientRefHash {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  "consent patient mismatch",
			Status:  "DENIED",
		}, nil
	}

	// 2. Check revocation
	if consent.Revoked {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  "consent has been revoked by patient",
			Status:  "CONSENT_REVOKED",
		}, nil
	}

	// 3. Check expiration
	now := time.Now().UTC()
	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err == nil && txTime != nil && txTime.Seconds > 0 {
		now = time.Unix(txTime.Seconds, int64(txTime.Nanos)).UTC()
	}
	expired, err := IsExpired(consent.ExpiryTimestamp, now)
	if err != nil || expired {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  "consent authorization has expired",
			Status:  "EXPIRED",
		}, nil
	}

	// 4. Check grantee authorization
	if consent.Grantee != "" && consent.Grantee != "ALL" && accessorHash != "" && consent.Grantee != accessorHash {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("accessor '%s' not authorized by consent grantee '%s'", accessorHash, consent.Grantee),
			Status:  "DENIED",
		}, nil
	}

	// 5. Check scope allowlist
	scopeAllowed := false
	for _, s := range consent.Scope {
		if s == scope {
			scopeAllowed = true
			break
		}
	}
	if !scopeAllowed {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("requested scope '%s' not authorized by consent", scope),
			Status:  "DENIED",
		}, nil
	}

	// 6. Check purpose alignment
	if purpose != "" && consent.Purpose != purpose {
		return &AccessVerificationResult{
			Allowed: false,
			Reason:  fmt.Sprintf("declared purpose '%s' mismatches consented purpose '%s'", purpose, consent.Purpose),
			Status:  "DENIED",
		}, nil
	}

	eventPayload, _ := json.Marshal(map[string]string{
		"requestId":      requestID,
		"patientRefHash": patientRefHash,
		"accessorHash":   accessorHash,
		"status":         "GRANTED",
	})
	_ = ctx.GetStub().SetEvent(EventAccessRequested, eventPayload)

	return &AccessVerificationResult{
		Allowed: true,
		Reason:  "valid active consent grant",
		Status:  "GRANTED",
	}, nil
}

// =========================================================================================
// Canonical Transaction 7: LogAccess
// =========================================================================================
func (c *MedralinkContract) LogAccess(
	ctx contractapi.TransactionContextInterface,
	requestID string,
	patientRefHash string,
	accessorHash string,
	scope string,
	purpose string,
	status string,
	timestamp string,
) (*AccessEvent, error) {
	if requestID == "" || patientRefHash == "" || accessorHash == "" || status == "" {
		return nil, fmt.Errorf("missing required access log fields")
	}
	if err := AssertZeroPII(requestID, patientRefHash, accessorHash, scope, purpose, status); err != nil {
		return nil, err
	}

	timestamp = resolveTimestamp(ctx, timestamp)

	event := &AccessEvent{
		DocType:        DocTypeAccessEvent,
		RequestID:      requestID,
		PatientRefHash: patientRefHash,
		AccessorHash:   accessorHash,
		Scope:          scope,
		Purpose:        purpose,
		Timestamp:      timestamp,
		Status:         status,
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixAudit, requestID)
	err = ctx.GetStub().PutState(key, eventJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to save access audit event: %v", err)
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(CompositeKeyPatientAudit, []string{patientRefHash, requestID})
	if err == nil {
		_ = ctx.GetStub().PutState(indexKey, []byte{0x00})
	}

	_ = ctx.GetStub().SetEvent(EventAccessLogged, eventJSON)
	return event, nil
}

// =========================================================================================
// Canonical Transaction 8: InvokeEmergencyAccess
// =========================================================================================
func (c *MedralinkContract) InvokeEmergencyAccess(
	ctx contractapi.TransactionContextInterface,
	emergencyID string,
	clinicianIDHash string,
	patientRefHash string,
	reasonCode string,
	scopeJSON string,
	expiryTimestamp string,
	createdAt string,
) (*EmergencyAccessEvent, error) {
	if emergencyID == "" || clinicianIDHash == "" || patientRefHash == "" || reasonCode == "" || scopeJSON == "" || expiryTimestamp == "" {
		return nil, fmt.Errorf("missing required emergency break-glass parameters")
	}

	if err := ValidateReasonCode(reasonCode); err != nil {
		return nil, err
	}

	var scopes []string
	if err := json.Unmarshal([]byte(scopeJSON), &scopes); err != nil {
		return nil, fmt.Errorf("invalid emergency scope JSON: %v", err)
	}
	if err := ValidateScope(scopes); err != nil {
		return nil, err
	}
	if _, err := ValidateTimestamp(expiryTimestamp); err != nil {
		return nil, err
	}
	if err := AssertZeroPII(emergencyID, clinicianIDHash, patientRefHash, reasonCode, expiryTimestamp); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixEmergency, emergencyID)
	exists, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if exists != nil {
		return nil, fmt.Errorf("emergency event ID '%s' already exists", emergencyID)
	}

	createdAt = resolveTimestamp(ctx, createdAt)

	emergencyEvent := &EmergencyAccessEvent{
		DocType:         DocTypeEmergencyAccessEvent,
		EmergencyID:     emergencyID,
		PatientRefHash:  patientRefHash,
		ClinicianIDHash: clinicianIDHash,
		ReasonCode:      reasonCode,
		Scope:           scopes,
		ExpiryTimestamp: expiryTimestamp,
		ReviewStatus:    "PENDING",
		ReviewerHash:    "",
		FindingsHash:    "",
		CreatedAt:       createdAt,
		ReviewedAt:      "",
	}

	eventJSON, err := json.Marshal(emergencyEvent)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, eventJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to save emergency event: %v", err)
	}

	indexKey, err := ctx.GetStub().CreateCompositeKey(CompositeKeyPatientEmergency, []string{patientRefHash, emergencyID})
	if err == nil {
		_ = ctx.GetStub().PutState(indexKey, []byte{0x00})
	}

	// Auto-log the emergency access attempt into the immutable audit trail
	auditReqID := fmt.Sprintf("EMG_%s", emergencyID)
	auditKey := fmt.Sprintf("%s%s", PrefixAudit, auditReqID)
	auditLog := &AccessEvent{
		DocType:        DocTypeAccessEvent,
		RequestID:      auditReqID,
		PatientRefHash: patientRefHash,
		AccessorHash:   clinicianIDHash,
		Scope:          fmt.Sprintf("EMERGENCY_BREAKGLASS(%s)", reasonCode),
		Purpose:        "emergency",
		Timestamp:      createdAt,
		Status:         "GRANTED_BREAKGLASS",
	}
	auditBytes, _ := json.Marshal(auditLog)
	_ = ctx.GetStub().PutState(auditKey, auditBytes)

	auditIndexKey, err := ctx.GetStub().CreateCompositeKey(CompositeKeyPatientAudit, []string{patientRefHash, auditReqID})
	if err == nil {
		_ = ctx.GetStub().PutState(auditIndexKey, []byte{0x00})
	}

	_ = ctx.GetStub().SetEvent(EventEmergencyAccessInvoked, eventJSON)
	return emergencyEvent, nil
}

// =========================================================================================
// Canonical Transaction 9: ReviewEmergencyAccess
// =========================================================================================
func (c *MedralinkContract) ReviewEmergencyAccess(
	ctx contractapi.TransactionContextInterface,
	emergencyID string,
	auditorIDHash string,
	reviewStatus string,
	findingsHash string,
	reviewedAt string,
) (*EmergencyAccessEvent, error) {
	if emergencyID == "" || auditorIDHash == "" || reviewStatus == "" {
		return nil, fmt.Errorf("emergencyID, auditorIDHash, and reviewStatus are required")
	}

	if err := ValidateReviewStatus(reviewStatus); err != nil {
		return nil, err
	}
	if err := AssertZeroPII(emergencyID, auditorIDHash, reviewStatus, findingsHash); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", PrefixEmergency, emergencyID)
	eventBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if eventBytes == nil {
		return nil, fmt.Errorf("emergency event ID '%s' not found", emergencyID)
	}

	var event EmergencyAccessEvent
	if err := json.Unmarshal(eventBytes, &event); err != nil {
		return nil, err
	}

	if event.ReviewStatus != "PENDING" && event.ReviewStatus != "PENDING_DGHS_POST_HOC_REVIEW" {
		return nil, fmt.Errorf("emergency event '%s' has already been reviewed (current status: '%s')", emergencyID, event.ReviewStatus)
	}

	reviewedAt = resolveTimestamp(ctx, reviewedAt)

	event.ReviewStatus = reviewStatus
	event.ReviewerHash = auditorIDHash
	event.FindingsHash = findingsHash
	event.ReviewedAt = reviewedAt

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(key, eventJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update emergency review state: %v", err)
	}

	_ = ctx.GetStub().SetEvent(EventEmergencyAccessReviewed, eventJSON)
	return &event, nil
}

// =========================================================================================
// Query Functions
// =========================================================================================

// GetPatientReference queries patient registration info by hash
func (c *MedralinkContract) GetPatientReference(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
) (*PatientReference, error) {
	patientBytes, err := ctx.GetStub().GetState(patientRefHash)
	if err != nil {
		return nil, err
	}
	if patientBytes == nil {
		return nil, fmt.Errorf("patient '%s' not found", patientRefHash)
	}
	var patient PatientReference
	if err := json.Unmarshal(patientBytes, &patient); err != nil {
		return nil, err
	}
	return &patient, nil
}

// GetRecordReference queries a record reference by ID
func (c *MedralinkContract) GetRecordReference(
	ctx contractapi.TransactionContextInterface,
	recordID string,
) (*RecordReference, error) {
	key := fmt.Sprintf("%s%s", PrefixRecord, recordID)
	recordBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if recordBytes == nil {
		return nil, fmt.Errorf("record '%s' not found", recordID)
	}
	var record RecordReference
	if err := json.Unmarshal(recordBytes, &record); err != nil {
		return nil, err
	}
	return &record, nil
}

// GetConsent queries a consent token by ID
func (c *MedralinkContract) GetConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) (*Consent, error) {
	key := fmt.Sprintf("%s%s", PrefixConsent, consentID)
	consentBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if consentBytes == nil {
		return nil, fmt.Errorf("consent '%s' not found", consentID)
	}
	var consent Consent
	if err := json.Unmarshal(consentBytes, &consent); err != nil {
		return nil, err
	}
	return &consent, nil
}

// GetEmergencyEvent queries an emergency break-glass event
func (c *MedralinkContract) GetEmergencyEvent(
	ctx contractapi.TransactionContextInterface,
	emergencyID string,
) (*EmergencyAccessEvent, error) {
	key := fmt.Sprintf("%s%s", PrefixEmergency, emergencyID)
	eventBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if eventBytes == nil {
		return nil, fmt.Errorf("emergency event '%s' not found", emergencyID)
	}
	var event EmergencyAccessEvent
	if err := json.Unmarshal(eventBytes, &event); err != nil {
		return nil, err
	}
	return &event, nil
}

// GetAccessHistory returns all audit log events for a patient reference
func (c *MedralinkContract) GetAccessHistory(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
) ([]*AccessEvent, error) {
	rawList, err := getStatesByPartialCompositeKey(ctx, CompositeKeyPatientAudit, []string{patientRefHash}, PrefixAudit)
	if err != nil {
		return nil, err
	}
	var events []*AccessEvent
	for _, raw := range rawList {
		var event AccessEvent
		if err := json.Unmarshal(raw, &event); err == nil {
			events = append(events, &event)
		}
	}
	return events, nil
}

// GetRecordsForPatient queries all record references for a patient
func (c *MedralinkContract) GetRecordsForPatient(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
) ([]*RecordReference, error) {
	rawList, err := getStatesByPartialCompositeKey(ctx, CompositeKeyPatientRecord, []string{patientRefHash}, PrefixRecord)
	if err != nil {
		return nil, err
	}
	var records []*RecordReference
	for _, raw := range rawList {
		var rec RecordReference
		if err := json.Unmarshal(raw, &rec); err == nil {
			records = append(records, &rec)
		}
	}
	return records, nil
}

// GetConsentsForPatient queries all consent records for a patient
func (c *MedralinkContract) GetConsentsForPatient(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
) ([]*Consent, error) {
	rawList, err := getStatesByPartialCompositeKey(ctx, CompositeKeyPatientConsent, []string{patientRefHash}, PrefixConsent)
	if err != nil {
		return nil, err
	}
	var consents []*Consent
	for _, raw := range rawList {
		var con Consent
		if err := json.Unmarshal(raw, &con); err == nil {
			consents = append(consents, &con)
		}
	}
	return consents, nil
}

// GetEmergencyEventsForPatient queries all emergency break-glass events for a patient
func (c *MedralinkContract) GetEmergencyEventsForPatient(
	ctx contractapi.TransactionContextInterface,
	patientRefHash string,
) ([]*EmergencyAccessEvent, error) {
	rawList, err := getStatesByPartialCompositeKey(ctx, CompositeKeyPatientEmergency, []string{patientRefHash}, PrefixEmergency)
	if err != nil {
		return nil, err
	}
	var events []*EmergencyAccessEvent
	for _, raw := range rawList {
		var ev EmergencyAccessEvent
		if err := json.Unmarshal(raw, &ev); err == nil {
			events = append(events, &ev)
		}
	}
	return events, nil
}
