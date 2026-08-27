package main

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func main() {
	contract := new(MedralinkContract)
	contract.Info.Version = "1.0.0"
	contract.Info.Description = "MedraLink Consent and Audit Provenance Chaincode (BCOLBD 2026)"
	contract.Info.Title = "MedralinkContract"

	chaincode, err := contractapi.NewChaincode(contract)
	if err != nil {
		panic(fmt.Sprintf("Error creating MedraLink chaincode: %v", err))
	}

	if err := chaincode.Start(); err != nil {
		panic(fmt.Sprintf("Error starting MedraLink chaincode: %v", err))
	}
}
