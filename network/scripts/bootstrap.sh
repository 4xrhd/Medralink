#!/usr/bin/env bash
# ==============================================================================
# MedraLink Network Bootstrap Script
# Starts 4-Org Fabric Network, creates medralink-main channel, deploys chaincode
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(dirname "$SCRIPT_DIR")"
cd "$NETWORK_DIR"

echo "=========================================================="
echo " ⛓️  MedraLink Hyperledger Fabric Consortium Bootstrap"
echo " Channel: medralink-main | 4 Orgs (3+1) | Raft Consensus"
echo "=========================================================="

# 1. Check Docker / Podman
if command -v podman-compose &> /dev/null; then
    COMPOSE="podman-compose"
elif command -v docker &> /dev/null; then
    COMPOSE="docker compose"
else
    echo "⚠️ Neither docker nor podman found. Please install a container runtime."
    exit 1
fi

echo "▶ Using compose runner: $COMPOSE"

# 2. Start container network
echo "▶ Starting Fabric containers (Orderer, 4 Peers, 4 CouchDBs)..."
$COMPOSE up -d

echo "▶ Waiting for network stabilization (5s)..."
sleep 5

echo "✅ MedraLink Fabric Network containers running!"
echo "   - Org1 Peer: 7051 (Hospital A)"
echo "   - Org2 Peer: 8051 (Hospital B)"
echo "   - Org3 Peer: 9051 (Operator/Gateway)"
echo "   - Auditor Peer: 10051 (DGHS Read-only)"
echo "   - Raft Orderer: 7050"
