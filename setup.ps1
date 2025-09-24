# PowerShell script to replace Makefile functionality
param(
    [Parameter(Position=0)]
    [string]$Action = "help"
)

$NATS_SERVER = "-s nats://nats:4222"

function Show-Help {
    Write-Host "Available commands:"
    Write-Host "  up           - Start all services"
    Write-Host "  down         - Stop all services"
    Write-Host "  logs         - Follow logs"
    Write-Host "  setup        - Setup NATS streams and KV buckets"
    Write-Host "  clear        - Clear all streams and KV buckets"
    Write-Host "  reset        - Clear and setup again"
    Write-Host "  monitor      - Open NATS monitoring UI"
    Write-Host "  cli          - Access NATS CLI"
    Write-Host "  debug        - Show current streams and KV buckets"
    Write-Host "  test         - Test NATS connection"
    Write-Host "  clean        - Clean everything (nuclear option)"
}

function Start-Services {
    Write-Host "Starting all services..."
    docker compose up -d
}

function Stop-Services {
    Write-Host "Stopping all services..."
    docker compose down
}

function Show-Logs {
    Write-Host "Following logs..."
    docker compose logs -f
}

function Setup-NATS {
    Write-Host "Setting up NATS streams and KV buckets..."
    Start-Services
    Start-Sleep 5
    
    # Create streams
    Write-Host "Creating streams..."
    docker exec nats-cli nats $NATS_SERVER stream add incidents-events --subjects "incidents.>" --retention limits --max-age 24h
    docker exec nats-cli nats $NATS_SERVER stream add instructions-events --subjects "instructions.>" --retention limits --max-age 24h
    
    # Create KV buckets
    Write-Host "Creating KV buckets..."
    docker exec nats-cli nats $NATS_SERVER kv add incidents-current
    docker exec nats-cli nats $NATS_SERVER kv add instructions-current
    docker exec nats-cli nats $NATS_SERVER kv add app-kpis
    docker exec nats-cli nats $NATS_SERVER kv add definitions-data
    
    Write-Host "Setup complete!"
}

function Clear-NATS {
    Write-Host "Clearing all NATS streams and KV buckets..."
    docker exec nats-cli nats $NATS_SERVER stream rm incidents-events --force 2>$null
    docker exec nats-cli nats $NATS_SERVER stream rm instructions-events --force 2>$null
    docker exec nats-cli nats $NATS_SERVER stream rm definitions-data --force 2>$null
    docker exec nats-cli nats $NATS_SERVER stream rm instructions-data --force 2>$null
    docker exec nats-cli nats $NATS_SERVER stream rm incidents-data --force 2>$null
    docker exec nats-cli nats $NATS_SERVER kv rm incidents-current --force 2>$null
    docker exec nats-cli nats $NATS_SERVER kv rm instructions-current --force 2>$null
    docker exec nats-cli nats $NATS_SERVER kv rm app-kpis --force 2>$null
    Write-Host "Clearing complete!"
}

function Reset-NATS {
    Clear-NATS
    Setup-NATS
}

function Open-Monitor {
    Write-Host "Opening NATS monitoring UI..."
    Start-Process "http://localhost:8222"
}

function Access-CLI {
    Write-Host "Accessing NATS CLI..."
    docker exec -it nats-cli bash
}

function Debug-NATS {
    Write-Host "Current NATS streams:"
    docker exec nats-cli nats $NATS_SERVER stream ls
    Write-Host "`nCurrent NATS KV buckets:"
    docker exec nats-cli nats $NATS_SERVER kv ls
}

function Test-NATS {
    Write-Host "Testing NATS connection..."
    docker exec nats-cli nats $NATS_SERVER pub test "connection test"
    Write-Host "NATS connection working!"
}

function Clean-All {
    Write-Host "Cleaning everything..."
    Stop-Services
    docker compose down -v
    docker volume rm frontend-assignment_nats-data -ErrorAction SilentlyContinue
    docker system prune -f
}

# Main switch
switch ($Action.ToLower()) {
    "up" { Start-Services }
    "down" { Stop-Services }
    "logs" { Show-Logs }
    "setup" { Setup-NATS }
    "clear" { Clear-NATS }
    "reset" { Reset-NATS }
    "monitor" { Open-Monitor }
    "cli" { Access-CLI }
    "debug" { Debug-NATS }
    "test" { Test-NATS }
    "clean" { Clean-All }
    default { Show-Help }
}
