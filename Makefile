.PHONY: all setup test api frontend demo teardown build

all: test build

setup:
	@echo "▶ Installing API dependencies..."
	@cd api && npm install
	@echo "▶ Installing Frontend dependencies..."
	@cd frontend && npm install
	@echo "▶ Tidying Go Chaincode modules..."
	@cd chaincode/medralink-cc && go mod tidy
	@echo "✅ Setup complete."

test:
	@echo "▶ Running Go Smart Contract Unit Tests..."
	@cd chaincode/medralink-cc && go test -v ./...
	@echo "▶ Running Backend API Integration Tests..."
	@cd api && npm test

build:
	@echo "▶ Building Frontend React SPA..."
	@cd frontend && npm run build
	@echo "▶ Compiling Go Chaincode..."
	@cd chaincode/medralink-cc && go build -v ./...

api:
	@echo "▶ Starting REST API Gateway on http://localhost:3001..."
	@cd api && npm start

frontend:
	@echo "▶ Starting React Web Portals on http://localhost:5173..."
	@cd frontend && npm run dev

teardown:
	@cd network && ./scripts/teardown.sh
