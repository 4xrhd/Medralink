package main

import (
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// resolveTimestamp returns the provided timestamp if non-empty, otherwise resolves the transaction or current UTC timestamp.
func resolveTimestamp(ctx contractapi.TransactionContextInterface, providedTimestamp string) string {
	if providedTimestamp != "" {
		return providedTimestamp
	}
	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err == nil && txTime != nil && txTime.Seconds > 0 {
		return time.Unix(txTime.Seconds, int64(txTime.Nanos)).UTC().Format(time.RFC3339)
	}
	return time.Now().UTC().Format(time.RFC3339)
}

// getStatesByPartialCompositeKey iterates through a partial composite key and fetches the underlying documents.
func getStatesByPartialCompositeKey(
	ctx contractapi.TransactionContextInterface,
	indexName string,
	attributes []string,
	keyPrefix string,
) ([][]byte, error) {
	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey(indexName, attributes)
	if err != nil {
		return nil, err
	}
	defer iterator.Close()

	var results [][]byte
	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(response.Key)
		if err != nil || len(compositeKeyParts) < 2 {
			continue
		}
		targetID := compositeKeyParts[1]
		targetKey := fmt.Sprintf("%s%s", keyPrefix, targetID)
		targetBytes, err := ctx.GetStub().GetState(targetKey)
		if err == nil && targetBytes != nil {
			results = append(results, targetBytes)
		}
	}
	return results, nil
}
