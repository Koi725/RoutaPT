#!/bin/bash
# RoutaPT — production build/run helper.
# After saving this file once, run: chmod +x build.sh
# Then: ./build.sh
set -e

GREEN='\033[0;32m'
TEAL='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${TEAL}╔══════════════════════════════════════╗${NC}"
echo -e "${TEAL}║     RoutaPT — Production Build       ║${NC}"
echo -e "${TEAL}╚══════════════════════════════════════╝${NC}"

# Check prerequisites
echo -e "\n${TEAL}[1/7]${NC} Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not installed${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose not installed${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"

# Setup environment
echo -e "\n${TEAL}[2/7]${NC} Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example — edit secrets before production!${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Build images
echo -e "\n${TEAL}[3/7]${NC} Building Docker images..."
docker compose -f RoutaPT.yml build --no-cache
echo -e "${GREEN}✓ All images built${NC}"

# Start services
echo -e "\n${TEAL}[4/7]${NC} Starting services..."
docker compose -f RoutaPT.yml up -d
echo -e "${GREEN}✓ All services started${NC}"

# Wait for database
echo -e "\n${TEAL}[5/7]${NC} Waiting for database to be ready..."
until docker exec routapt-db pg_isready -U routapt -d routapt > /dev/null 2>&1; do
    sleep 2
    echo "  Waiting for PostgreSQL..."
done
echo -e "${GREEN}✓ Database is ready${NC}"

# Run migrations
echo -e "\n${TEAL}[6/7]${NC} Running Django migrations..."
docker exec routapt-backend python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"

# Prefetch data
echo -e "\n${TEAL}[7/7]${NC} Prefetching heatmap data into Redis cache..."
docker exec routapt-backend python -c "
from apps.heatmap.tasks import prefetch_heatmap_data
result = prefetch_heatmap_data()
print(result)
"
echo -e "${GREEN}✓ Cache warmed up${NC}"

# Status
echo -e "\n${TEAL}╔══════════════════════════════════════╗${NC}"
echo -e "${TEAL}║         RoutaPT is running!           ║${NC}"
echo -e "${TEAL}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}  http://localhost"
echo -e "  ${GREEN}API:${NC}       http://localhost/api/"
echo -e "  ${GREEN}Admin:${NC}    http://localhost/admin/"
echo ""
echo -e "  ${TEAL}Services:${NC}"
docker compose -f RoutaPT.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "  ${TEAL}Logs:${NC} docker compose -f RoutaPT.yml logs -f"
echo -e "  ${TEAL}Stop:${NC} docker compose -f RoutaPT.yml down"
