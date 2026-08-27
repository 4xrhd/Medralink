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
