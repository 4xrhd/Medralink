# MedraLink UML Architectural Diagrams Catalog

This directory contains the complete collection of Unified Modeling Language (UML) architectural diagrams for the **MedraLink Decentralized Healthcare Interoperability & Audit Provenance Platform**.

All diagrams are provided in dual formats:
- **Interactive Markdown Visualizations:** Renderable natively in GitHub/Markdown tools via **Mermaid**.
- **Formal Specifications:** Raw **PlantUML (`.puml`)** source definitions for enterprise modeling tools.

---

## 📑 Diagram Catalog Index

| # | Diagram Title | Type | Focus Area | File Link |
|---|---|---|---|---|
| **01** | **System Use Case Diagram** | UML Use Case | User roles, autonomous agents, and system functional boundaries | [`01_USE_CASE_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/01_USE_CASE_DIAGRAM.md) |
| **02** | **Class & Data Model Diagram** | UML Class | 6 On-Chain smart contract structs + Off-Chain AES-256-GCM FHIR entity relationships | [`02_CLASS_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/02_CLASS_DIAGRAM.md) |
| **03** | **Consent-Gated Access Sequence** | UML Sequence | Granular consent evaluation, hash tamper checking, AES-256-GCM decryption, and audit logging | [`03_SEQUENCE_CONSENT_ACCESS_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/03_SEQUENCE_CONSENT_ACCESS_DIAGRAM.md) |
| **04** | **Emergency Break-Glass Sequence** | UML Sequence | Trauma vitals triage (GCS/MAP), 60-min token issuance, and post-hoc DGHS auditor review | [`04_SEQUENCE_EMERGENCY_BREAK_GLASS_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/04_SEQUENCE_EMERGENCY_BREAK_GLASS_DIAGRAM.md) |
| **05** | **Consent & Emergency State Machines** | UML State Machine | Lifecycle states (`ACTIVE`, `EXPIRED`, `REVOKED`, `PENDING_REVIEW`, `REVIEWED`, `DISCIPLINARY`) | [`05_STATE_MACHINE_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/05_STATE_MACHINE_DIAGRAM.md) |
| **06** | **Agentic AI DAG Workflow Activity** | UML Activity | 5-agent DAG pipeline (Clinical Intake, FHIR Normalization, Dynamic Policy Check, Forensic Scan) | [`06_ACTIVITY_AGENTIC_DAG_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/06_ACTIVITY_AGENTIC_DAG_DIAGRAM.md) |
| **07** | **Consortium Deployment Topology** | UML Deployment | 4-Organization Fabric network (Org1, Org2, Org3, OrgAuditor), Raft Orderers, and Vaults | [`07_DEPLOYMENT_TOPOLOGY_DIAGRAM.md`](file:///home/tr/Downloads/MedraLink/prototype/docs/diagrams/07_DEPLOYMENT_TOPOLOGY_DIAGRAM.md) |

---

## 🛠️ How to Render & Export

### 1. In Markdown Viewers / GitHub
All Markdown files contain embedded `mermaid` code blocks that render immediately in modern Markdown viewers, IDE previews, and GitHub web interface.

### 2. Exporting with PlantUML CLI / Extension
To compile the PlantUML blocks to PNG or SVG:
```bash
# Using PlantUML CLI
plantuml diagram.puml -tpng
plantuml diagram.puml -tsvg
```
