# MedraLink Prototype Setup & Deployment Manual

**Competition:** Blockchain Olympiad Bangladesh (BCOLBD 2026)  
**Free Tier Target:** Local Dev / Podman / Oracle Cloud Always Free

---

## 🛠️ Prerequisites

- **Node.js:** v18 LTS or later (`node -v`)
- **Go:** v1.21+ (`go version`)
- **Container Engine:** Docker or Podman (Optional for standalone mode)

---

## 🚀 Quick Launch (Standalone Mode — No Docker Needed)

You can launch the complete prototype vertical slice immediately on any standard laptop or VM without needing Docker:

```bash
# 1. Start Backend API Gateway (Port 3001)
cd prototype/api
npm install
npm start &

# 2. Start React Web Portals (Port 5173)
cd ../frontend
npm install
npm run dev &
```

Then open your browser at **`http://localhost:5173`**.

---

## ⛓️ Docker / Podman Fabric Network Mode

To run with the real multi-container Hyperledger Fabric network:

```bash
cd prototype/network
./scripts/bootstrap.sh
```

---

## 🧪 Running Automated Unit & Integration Tests

```bash
# Test Go Smart Contract (All 9 Canonical Transactions)
cd prototype/chaincode/medralink-cc
go test -v ./...

# Test API Gateway Endpoints
cd ../../api
npm test
```

---

## 🔑 Demo Personas & Login Credentials

The interactive web portal includes an instant role switcher in the top navigation bar. For API testing, supply the `x-demo-role` HTTP header.

| Role | Name / Persona | Synthetic ID / Account ID | MSP Organization | X.509 Certificate OU |
|---|---|---|---|---|
| **Patient** | Rahim Chowdhury | `BD-HEALTH-994821` (DOB: `1992-05-14`) | `Org1MSP` (Hospital A) | `OU=Patient` |
| **Clinician** | Dr. Hasan Mahmud | `clinician_dr_hasan` (`DR_HASAN_CLINICIAN`) | `Org1MSP` (Hospital A) | `OU=Clinician` |
| **Emergency** | Dr. Nusrat Alam | `emergency_dr_alam` (`DR-EMERGENCY-02`) | `Org2MSP` (Hospital B ED) | `OU=Emergency` |
| **Auditor** | DGHS Inspector | `auditor_dghs_01` (`AUDITOR-DGHS-01`) | `OrgAuditorMSP` (DGHS) | `OU=Auditor` (Read-Only) |
| **Admin** | System Admin | `admin_hospital_a` | `Org1MSP` (Hospital A) | `OU=Admin` |
| **Agentic AI** | Multi-Agent Orchestrator | `MedraLinkOrchestrator` | `DAG Orchestrator` | `Autonomous Multi-Agent` |

