# RoutaPT — Setup Guide

## Prerequisites
- Docker & Docker Compose
- PostgreSQL 17 with PostGIS 3.5 and pgRouting 3.7 (for local dev)
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

## Quick Start (Docker)
1. Clone the repo: `git clone https://github.com/Koi725/RoutaPT.git`
2. Copy environment: `cp .env.example .env`
3. Edit `.env` with your database credentials
4. Import OSM data (see Data Import section below)
5. Run: `chmod +x build.sh && ./build.sh`
6. Open http://localhost

## Data Import
Download Portugal OSM data and import into PostGIS:
```bash
wget https://download.geofabrik.de/europe/portugal-latest.osm.pbf
osm2pgsql -d routapt -U routapt -H localhost -W --create --slim --drop --latlong --hstore portugal-latest.osm.pbf
```

Build routing topology:
```bash
psql -d routapt -c "ALTER TABLE planet_osm_line ADD COLUMN IF NOT EXISTS gid SERIAL PRIMARY KEY;"
psql -d routapt -c "SELECT pgr_createTopology('planet_osm_line', 0.00001, 'way', 'gid');"
```

## Local Development (without Docker)

### Backend
```bash
cd routapt-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd routapt-frontend
npm install
npm run dev
```

## Environment Variables
See `.env.example` for all required variables.

## Architecture
See `docs/RoutaPT_Architecture.pdf` and `README.md` for full system design.
