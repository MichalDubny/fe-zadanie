.PHONY: up down logs setup streams monitor cli clean clear-streams reset debug-streams debug-kv

# NATS connection string
NATS_SERVER = --server nats://nats:4222

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Follow logs
logs:
	docker compose logs -f

# Setup initial streams and KV buckets
setup: up
	@echo "Setting up NATS streams and KV buckets..."
	sleep 5
	docker exec nats-cli nats $(NATS_SERVER) stream add incidents-events --subjects "incidents.>" --retention limits --max-age 24h
	docker exec nats-cli nats $(NATS_SERVER) stream add instructions-events --subjects "instructions.>" --retention limits --max-age 24h
	docker exec nats-cli nats $(NATS_SERVER) kv add incidents-current
	docker exec nats-cli nats $(NATS_SERVER) kv add instructions-current
	docker exec nats-cli nats $(NATS_SERVER) kv add app-kpis
	@echo "Setup complete!"

# Clear all streams and KV buckets
clear-streams:
	@echo "Clearing all NATS streams and KV buckets..."
	-docker exec nats-cli nats $(NATS_SERVER) stream rm incidents-events --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) stream rm instructions-events --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) stream rm definitions-data --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) stream rm instructions-data --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) stream rm incidents-data --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) kv rm incidents-current --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) kv rm instructions-current --force 2>/dev/null
	-docker exec nats-cli nats $(NATS_SERVER) kv rm app-kpis --force 2>/dev/null
	@echo "Clearing complete!"

# Reset: clear and setup again
reset: clear-streams setup

# Monitor NATS (opens browser to monitoring UI)
monitor:
	open http://localhost:8222

# Access NATS CLI
cli:
	docker exec -it nats-cli bash

# Debug commands
debug-streams:
	@echo "Current NATS streams:"
	docker exec nats-cli nats $(NATS_SERVER) stream ls
	@echo "Current NATS KV buckets:"
	docker exec nats-cli nats $(NATS_SERVER) kv ls

debug-kv:
	@echo "KV bucket contents:"
	-docker exec nats-cli nats $(NATS_SERVER) kv get incidents-current --all 2>/dev/null || echo "No incidents-current KV bucket"
	-docker exec nats-cli nats $(NATS_SERVER) kv get instructions-current --all 2>/dev/null || echo "No instructions-current KV bucket"

# Test NATS connection
test-nats:
	@echo "Testing NATS connection..."
	docker exec nats-cli nats $(NATS_SERVER) pub test "connection test"
	@echo "NATS connection working!"

# Clean everything (nuclear option)
clean: down
	docker compose down -v
	docker volume rm frontend-assignment_nats-data || true
	docker system prune -f