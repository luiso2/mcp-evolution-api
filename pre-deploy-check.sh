#!/bin/bash

echo "========================================"
echo "Pre-Deploy Validation Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if TypeScript compiles
echo "1. Checking TypeScript compilation..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    echo -e "${YELLOW}Fix the errors above before pushing to Git${NC}"
    exit 1
fi

echo ""
echo "2. Checking for required environment variables..."

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    
    # Check for required variables
    if grep -q "EVOLUTION_API_URL" .env; then
        echo -e "${GREEN}  ✓ EVOLUTION_API_URL is set${NC}"
    else
        echo -e "${YELLOW}  ⚠ EVOLUTION_API_URL not found in .env${NC}"
    fi
    
    if grep -q "EVOLUTION_API_KEY" .env; then
        echo -e "${GREEN}  ✓ EVOLUTION_API_KEY is set${NC}"
    else
        echo -e "${YELLOW}  ⚠ EVOLUTION_API_KEY not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found (OK for production)${NC}"
fi

echo ""
echo "3. Checking Git status..."
git status --short
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Git repository is valid${NC}"
else
    echo -e "${RED}✗ Not a Git repository${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
echo "========================================"
echo ""
echo "To deploy, run:"
echo "  git add ."
echo "  git commit -m 'your message'"
echo "  git push origin master"
