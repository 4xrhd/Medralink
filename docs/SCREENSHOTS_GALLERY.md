# MedraLink UI Mock Screenshots Gallery & Presentation Guide

This gallery provides high-definition (1920×1080) mock screenshots of the **MedraLink Decentralized Healthcare Interoperability & Audit Provenance Platform** for use in:
- 📊 **Competition Slide Decks & Pitch Presentations** (BCOLBD 2026 Student Track)
- 🖼️ **Academic Posters & Banners** (A1/A0 Print Formats)
- 📑 **Technical Reports, Whitepaper Addenda & Demos**

All image files are located in **[`prototype/docs/screenshots/`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/)**.

---

## 🖼️ High-Resolution Mock Screenshots Catalog

### 1. Patient Consent Governance & Health Vault
* **File:** [`01_Patient_Portal_Consent_Vault.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/01_Patient_Portal_Consent_Vault.png)
* **Description:** Patient self-sovereign consent management dashboard. Shows granular scope selection (`AllergyIntolerance`, `MedicationRequest`, `Observation`), purpose binding (`treatment`, `diagnostic`), active/expired consent tokens, and immutable access history.
* **Key Talking Point:** Demonstrates strict compliance with Bangladesh Personal Data Protection Ordinance (PDPO 2025) and patient consent self-sovereignty without raw PII on ledger.

---

### 2. Authorized Clinician Consent-Gated Record Decryption
* **File:** [`02_Clinician_Portal_Decrypted_FHIR.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/02_Clinician_Portal_Decrypted_FHIR.png)
* **Description:** Clinician record access portal. Demonstrates on-chain consent verification, cryptographic hash integrity checks (`recordHash == SHA256(ciphertext)`), AES-256-GCM envelope decryption, and dual clinical/JSON views.
* **Key Talking Point:** Proves zero-trust off-chain storage architecture where clinical payloads are only decrypted when authorized by an active smart contract consent token.

---

### 3. Emergency Break-Glass Life-Safety Protocol
* **File:** [`03_Emergency_Break_Glass_Portal.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/03_Emergency_Break_Glass_Portal.png)
* **Description:** Emergency trauma override portal. Displays Glasgow Coma Scale (GCS) and Mean Arterial Pressure (MAP) inputs, 60-minute time-boxed emergency break-glass token dispensation, and life-threatening allergy alerts.
* **Key Talking Point:** Solves delayed trauma care for unconscious patients while preventing unauthorized snooping through time-boxed tokens and mandatory audit review.

---

### 4. DGHS Regulatory Compliance & Forensic Audit Dashboard
* **File:** [`04_Auditor_Portal_Compliance_Dashboard.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/04_Auditor_Portal_Compliance_Dashboard.png)
* **Description:** Directorate General of Health Services (DGHS) auditor portal. Shows emergency break-glass review queue (`APPROPRIATE` vs `INAPPROPRIATE`), cryptographic findings hash anchoring, and live blockchain block explorer.
* **Key Talking Point:** Provides regulatory non-repudiation and automated referral to the Bangladesh Medical & Dental Council (BMDC) for any unverified break-glass abuse.

---

### 5. Consortium Administration & Identity Onboarding
* **File:** [`05_Consortium_Admin_Portal.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/05_Consortium_Admin_Portal.png)
* **Description:** Consortium administrator portal. Shows X.509 healthcare provider registration (`BSMMU`, `Evercare`, `National Health Gateway`), certificate serial hashing, and synthetic patient pseudonymization (`SHA256(HealthID || DOB || Salt)`).
* **Key Talking Point:** Enforces 4-Organization permissioned network governance with zero storage of national identity numbers (NID) or raw biometric templates on blockchain.

---

### 6. Agentic AI Studio — Master DAG Orchestrator
* **File:** [`06_Agentic_AI_Studio_DAG_Orchestrator.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/06_Agentic_AI_Studio_DAG_Orchestrator.png)
* **Description:** Autonomous AI Multi-Agent orchestration studio. Features 3 canonical clinical scenarios, dynamic Directed Acyclic Graph (DAG) planner, and visual multi-tier execution trace.
* **Key Talking Point:** Demonstrates how 5 specialized autonomous agents coordinate clinical intake, semantic normalization, policy checks, and blockchain settlement in <300ms.

---

### 7. Agentic AI — FHIR Semantic Normalization Sandbox
* **File:** [`07_Agentic_AI_FHIR_Normalization.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/07_Agentic_AI_FHIR_Normalization.png)
* **Description:** `FHIRAgent` sandbox. Translates unstructured clinical notes and laboratory feeds into structured HL7 FHIR R4 bundles with SNOMED-CT, LOINC, and RxNorm ontology codes.
* **Key Talking Point:** Bridges the interoperability gap between Bangladesh's 5,000+ disparate legacy EMR systems and the unified national standard.

---

### 8. Agentic AI — Trauma Triage & Break-Glass Evaluator
* **File:** [`08_Agentic_AI_Trauma_Triage.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/08_Agentic_AI_Trauma_Triage.png)
* **Description:** `EmergencyTriageAgent` sandbox. Evaluates incoming physiological vitals, calculates Shock Index and Emergency Severity Index (ESI Level 1), and issues 60-min cryptographic break-glass tokens.
* **Key Talking Point:** Uses algorithmic vital validation to prevent unauthorized physician break-glass abuse while ensuring instant access during genuine emergencies.

---

### 9. Agentic AI — Forensic Ledger & SIEM Scanner
* **File:** [`09_Agentic_AI_Forensic_Audit.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/09_Agentic_AI_Forensic_Audit.png)
* **Description:** `AuditAgent` sandbox. Continuously parses Hyperledger Fabric ledger blocks and hospital SIEM telemetry, detects anomalous access patterns, and constructs evidence dossiers for DGHS auditors.
* **Key Talking Point:** Transforms static audit logs into proactive AI-assisted regulatory oversight.

---

### 10. Interactive 9-Step Demo Tour Modal
* **File:** [`10_Interactive_Demo_Tour_Modal.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/10_Interactive_Demo_Tour_Modal.png)
* **Description:** Interactive 9-step guided walkthrough for competition judges, covering the entire lifecycle from consortium bootstrap to forensic audit clearance.
* **Key Talking Point:** Highlights end-to-end usability and test-driven prototype maturity for jury evaluations.

---

## 💡 Best Practices for Slides & Poster Presentations

1. **Aspect Ratio:** All images are native **16:9 (1920×1080)**, optimized for modern widescreen slide presentations (PowerPoint, Google Slides, Keynote) and 2-column or 3-column academic poster layouts.
2. **Crop Suggestions:**
   - For **slide feature callouts**, crop specific cards (e.g., the "Consent-Gated Vault" or "DAG Execution Trace") to highlight technical architecture.
   - For **poster centerpieces**, use [`06_Agentic_AI_Studio_DAG_Orchestrator.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/06_Agentic_AI_Studio_DAG_Orchestrator.png) or [`02_Clinician_Portal_Decrypted_FHIR.png`](file:///home/tr/Downloads/MedraLink/prototype/docs/screenshots/02_Clinician_Portal_Decrypted_FHIR.png) to showcase the rich dark-mode UI aesthetics.
3. **Contrast:** The sleek obsidian dark theme (`#0F172A`) with emerald, sky-blue, and amber status accents provides maximum contrast on 4K projectors and glossy banner prints.
