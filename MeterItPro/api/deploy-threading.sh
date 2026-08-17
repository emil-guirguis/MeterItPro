#!/bin/bash

# MCP Threading System Deployment Script
# This script deploys the MCP system with threading architecture

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
COMPOSE_FILE="docker-compose.threading.yml"
ENV_FILE=".env.threading"

echo -e "${BLUE}🚀 MCP Threading System Deployment${NC}"
echo -e "${BLUE}Environment: ${DEPLOYMENT_ENV}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended"
    fi
    
    print_status "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Create environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.threading.example" ]; then
            cp .env.threading.example "$ENV_FILE"
            print_warning "Created $ENV_FILE from example. Please review and update the configuration."
        else
            print_error "No environment configuration found"
            exit 1
        fi
    fi
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p uploads
    mkdir -p monitoring/prometheus
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    # Set proper permissions
    chmod 755 logs uploads
    
    print_status "Environment setup completed"
}

# Build and deploy
deploy() {
    print_info "Location and deploying services..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_status "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up (healthy)"; then
            print_status "Services are healthy"
            return 0
        fi
        
        echo -n "."
        sleep 10
        ((attempt++))
    done
    
    print_error "Services failed to become healthy within timeout"
    docker-compose -f "$COMPOSE_FILE" logs
    exit 1
}

# Run health checks
run_health_checks() {
    print_info "Running health checks..."
    
    # Check backend health
    local backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
    if [ "$backend_health" = "200" ]; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed (HTTP $backend_health)"
        return 1
    fi
    
    # Check threading system
    local threading_health=$(curl -s http://localhost:3001/api/threading/health | jq -r '.success' 2>/dev/null || echo "false")
    if [ "$threading_health" = "true" ]; then
        print_status "Threading system health check passed"
    else
        print_error "Threading system health check failed"
        return 1
    fi
    
    # PostgreSQL health check would go here if using containerized database
    # if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres &>/dev/null; then
    #     print_status "PostgreSQL health check passed"
    # else
    #     print_error "PostgreSQL health check failed"
    #     return 1
    # fi
    
    print_status "All health checks passed"
}

# Show deployment status
show_status() {
    print_info "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    
    # Show service URLs
    echo -e "${BLUE}Service URLs:${NC}"
    echo "  Backend API: http://localhost:3001"
    echo "  API Health: http://localhost:3001/api/health"
    echo "  Threading Status: http://localhost:3001/api/threading/status"
    # echo "  PostgreSQL: postgresql://localhost:5432" (when using containerized database)
    
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "prometheus"; then
        echo "  Prometheus: http://localhost:9090"
    fi
    
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "grafana"; then
        echo "  Grafana: http://localhost:3000"
    fi
    
    echo ""
    
    # Show useful commands
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  Restart backend: docker-compose -f $COMPOSE_FILE restart backend"
    echo "  Threading status: curl -s http://localhost:3001/api/threading/status | jq"
    echo "  Threading restart: curl -X POST http://localhost:3001/api/threading/restart"
    echo ""
}

# Cleanup function
cleanup() {
    print_info "Cleaning up old containers and images..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    print_status "Cleanup completed"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    echo ""
    
    check_prerequisites
    setup_environment
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        cleanup
    fi
    
    deploy
    wait_for_services
    
    if run_health_checks; then
        show_status
        print_status "Deployment completed successfully! 🎉"
    else
        print_error "Deployment completed with health check failures"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_status
        ;;
    "health")
        run_health_checks
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-backend}"
        ;;
    "stop")
        print_info "Stopping services..."
        docker-compose -f "$COMPOSE_FILE" down
        print_status "Services stopped"
        ;;
    "restart")
        print_info "Restarting services..."
        docker-compose -f "$COMPOSE_FILE" restart "${2:-backend}"
        print_status "Services restarted"
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|status|health|logs|stop|restart|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the complete system (default)"
        echo "  status   - Show deployment status"
        echo "  health   - Run health checks"
        echo "  logs     - Show service logs"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart services"
        echo "  cleanup  - Clean up old containers and images"
        exit 1
        ;;
esac