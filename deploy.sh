#!/bin/bash

# Evolution API MCP Server - Deployment Script

echo "🚀 Evolution API MCP Server Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        print_status "Docker is installed"
        return 0
    else
        print_error "Docker is not installed"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        return 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_status "Docker Compose is installed"
        return 0
    else
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        return 1
    fi
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_status ".env file created. Please edit it with your configuration."

        read -p "Do you want to edit .env now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        print_status ".env file exists"
    fi
}

# Build and start services
deploy_docker() {
    echo ""
    echo "Starting Docker deployment..."

    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose pull

    # Build MCP server
    print_status "Building MCP server..."
    docker-compose build

    # Start services
    print_status "Starting services..."
    docker-compose up -d

    # Check if services are running
    sleep 5
    if docker-compose ps | grep -q "Up"; then
        print_status "Services are running!"
        echo ""
        echo "Services URLs:"
        echo "  - Evolution API: http://localhost:8080"
        echo "  - MCP Server: http://localhost:3000"
        echo "  - PostgreSQL: localhost:5432"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
    else
        print_error "Services failed to start"
        echo "Check logs: docker-compose logs"
        exit 1
    fi
}

# Deploy to Railway
deploy_railway() {
    echo ""
    echo "Deploying to Railway..."

    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed"
        echo "Install: npm install -g @railway/cli"
        exit 1
    fi

    print_status "Logging in to Railway..."
    railway login

    print_status "Linking project..."
    railway link

    print_status "Deploying..."
    railway up

    print_status "Deployment complete!"
    railway open
}

# Deploy to Vercel
deploy_vercel() {
    echo ""
    echo "Deploying to Vercel..."

    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not installed"
        echo "Install: npm install -g vercel"
        exit 1
    fi

    print_status "Building project..."
    npm run build

    print_status "Deploying to Vercel..."
    vercel --prod

    print_status "Deployment complete!"
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1) Local Docker Compose"
    echo "2) Railway"
    echo "3) Vercel"
    echo "4) Exit"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1)
            check_docker || exit 1
            check_docker_compose || exit 1
            setup_env
            deploy_docker
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_vercel
            ;;
        4)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_menu
            ;;
    esac
}

# Main execution
echo ""
print_status "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed"
    echo "Please install Node.js 18+: https://nodejs.org"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not installed. Installing..."
    npm install
fi

# Show menu
show_menu