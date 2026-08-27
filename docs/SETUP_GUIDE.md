# MedraLink Prototype Setup & Deployment Manual

**Competition:** Blockchain Olympiad Bangladesh (BCOLBD 2026)  
**Track:** Student Category — Blockchain / Agentic AI Track  
**Free Tier Target:** Local Dev / Podman / Oracle Cloud Always Free  

---

## 🛠️ Prerequisites

- **Node.js:** v20+ LTS (`node -v`)
- **Go:** v1.22+ (`go version`)
- **Container Engine:** Docker or Podman (Optional for standalone mode)

---

## 🚀 Quick Launch (Root Automation Makefile)

The root repository provides unified `make` targets to manage testing, building, and launching all microservices:

```bash
# 1. Run all unit and integration tests (34/34 tests passing)
make test

# 2. Build production frontend bundle & compile Go smart contracts
make build

# 3. Launch Backend API Gateway on Port 3001
make api &

# 4. Launch React Web Frontend on Port 5173
make frontend &
```

Then open your browser at **`http://localhost:5173`**.

---

## ⛓️ Docker / Podman Fabric Network Mode

To run with the real 4-peer multi-container Hyperledger Fabric 2.5 consortium network:

```bash
cd prototype/network
./scripts/bootstrap.sh
```

---

## 🧪 Automated Testing Commands

```bash
# Test Go Smart Contract (All 9 Canonical Transactions, 9 Unit Tests)
cd prototype/chaincode/medralink-cc
go test -v ./...

# Test API Gateway & Multi-Agent DAG Integration (25 Integration Tests)
cd prototype/api
npm test

# Run Both Test Suites from Root
make test
```

---

## 🔑 Demo Personas & Login Credentials

The interactive web portal includes an instant role switcher in the top navigation bar. For API testing, supply the `x-user-role` or `x-demo-role` HTTP header.

| Role | Name / Persona | Synthetic ID / Account ID | MSP Organization | X.509 Certificate OU | Capabilities |
|---|---|---|---|---|---|
| **Patient** | Rahim Chowdhury | `BD-HEALTH-994821` (DOB: `1992-05-14`) | `Org1MSP` (Hospital A) | `OU=Patient` | Issue consent, revoke consent, direct vault view |
| **Clinician** | Dr. Hasan Mahmud | `clinician_dr_hasan` (`DR_HASAN_CLINICIAN`) | `Org1MSP` (Hospital A) | `OU=Clinician` | Create encrypted FHIR records, verify consent |
| **Emergency** | Dr. Nusrat Alam | `emergency_dr_alam` (`DR-EMERGENCY-02`) | `Org2MSP` (Hospital B ED) | `OU=Emergency` | 60-min emergency break-glass override |
| **Auditor** | DGHS Inspector | `auditor_dghs_01` (`AUDITOR-DGHS-01`) | `OrgAuditorMSP` (DGHS) | `OU=Auditor` | Post-hoc break-glass review, block explorer |
| **Admin** | System Admin | `admin_hospital_a` | `Org1MSP` (Hospital A) | `OU=Admin` | Provider registration, patient onboard, bootstrap |
| **Agentic AI** | Multi-Agent Orchestrator | `MedraLinkOrchestrator` | `DAG Orchestrator` | `Autonomous Multi-Agent` | Multi-agent DAG workflows & ontology sandboxes |
