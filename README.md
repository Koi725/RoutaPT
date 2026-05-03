# RoutaPT — Smart Road Navigator for Portugal

A full-stack WebGIS application that provides intelligent road navigation, real-time incident reporting, and spatial analytics for Portugal's entire road network.

Built as a university project for **Sistemas de Informação Geográfica** + **Projeto Temático em Aplicações SIG** at Universidade de Aveiro (ESTGA).

---

## Features

**Route Calculation** — A-to-B navigation using pgRouting's Dijkstra algorithm on Portugal's real road network (682,612 segments, 169,516 km). Speed-weighted cost function prioritizes motorways and primary roads for realistic travel times.

**Geocoding** — Address search powered by Nominatim. Type any location in Portugal and get instant coordinate resolution with autocomplete suggestions.

**Incident Reporting** — Crowd-sourced road incident system inspired by Waze. Report accidents, roadwork, police presence, hazards, closures, traffic, and weather events. Incidents auto-expire based on type and support crowd validation (confirm/dismiss).

**Network Statistics** — Real-time analytics dashboard showing Portugal's road network breakdown by type (motorway, trunk, primary, secondary, residential) with total kilometers and segment counts.

**Interactive Map** — Full-screen Leaflet map with glassmorphism UI panels, smooth animations, and responsive design. Toggle layers for POIs, speed cameras, heatmaps, and incidents.

---

## Tech Stack

| Layer         | Technology                                        |
| ------------- | ------------------------------------------------- |
| Database      | PostgreSQL 17 + PostGIS 3.5 + pgRouting 3.7       |
| Data Source   | OpenStreetMap (Geofabrik Portugal extract)        |
| Data Import   | osm2pgsql                                         |
| Backend       | Django 5.1 + GeoDjango + Django REST Framework    |
| Frontend      | Next.js 16 + React 19 + TypeScript                |
| Map Rendering | Leaflet + react-leaflet                           |
| Styling       | Tailwind CSS 4 (component-based CSS architecture) |
| Deployment    | Docker Compose + Nginx + Let's Encrypt SSL        |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                    │
│              Next.js + Leaflet + Tailwind            │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│                   Nginx (SSL + Proxy)                │
└──────────┬─────────────────────────┬────────────────┘
           │ /api/*                  │ /*
┌──────────▼──────────┐  ┌───────────▼───────────────┐
│  Django + GeoDjango  │  │   Next.js Static Build    │
│  DRF REST API        │  │                           │
│  Port 8000           │  │   Port 3000               │
└──────────┬──────────┘  └───────────────────────────┘
           │ SQL
┌──────────▼──────────────────────────────────────────┐
│         PostgreSQL + PostGIS + pgRouting              │
│    682,612 road segments · 2.1M topology nodes       │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
RoutaPT/
├── routapt-backend/
│   ├── config/                 # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── routing/            # A-to-B route calculation
│   │   ├── incidents/          # Crowd-sourced road reports
│   │   ├── pois/               # Points of interest + cameras
│   │   └── heatmap/            # Density analytics + stats
│   ├── scripts/
│   │   └── setup_db.sql        # PostGIS + pgRouting extensions
│   ├── Dockerfile
│   └── requirements.txt
│
├── routapt-frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React components (OOP structure)
│   │   │   ├── brand/
│   │   │   ├── search-bar/
│   │   │   ├── map-view/
│   │   │   ├── route-card/
│   │   │   ├── layer-toggle/
│   │   │   ├── incident-panel/
│   │   │   ├── stats-panel/
│   │   │   └── ...
│   │   ├── lib/                # API call modules
│   │   ├── hooks/              # Custom React hooks
│   │   └── tailwind/           # Component-based CSS
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── RoutaPT_Architecture.pdf
│   ├── RoutaPT_Requirements.xlsx
│   └── RoutaPT_UML_Diagrams.html
│
├── RoutaPT.yml                 # Docker Compose
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Endpoint                   | Description                              |
| ------ | -------------------------- | ---------------------------------------- |
| GET    | `/api/routing/route/`      | Calculate route between two coordinates  |
| GET    | `/api/routing/geocode/`    | Search addresses (Nominatim proxy)       |
| GET    | `/api/pois/`               | Get POIs in bounding box                 |
| GET    | `/api/pois/cameras/`       | Get speed cameras in bounding box        |
| POST   | `/api/pois/near-route/`    | Find POIs along a route corridor         |
| GET    | `/api/incidents/`          | List active incidents in bounding box    |
| POST   | `/api/incidents/`          | Report a new incident                    |
| GET    | `/api/incidents/:id/`      | Get incident details                     |
| POST   | `/api/incidents/:id/vote/` | Confirm or dismiss an incident           |
| GET    | `/api/heatmap/roads/`      | Road density heatmap data                |
| GET    | `/api/heatmap/incidents/`  | Incident density heatmap data            |
| GET    | `/api/heatmap/stats/`      | Network statistics (total km, breakdown) |

All spatial endpoints return **GeoJSON** compatible with Leaflet's `L.geoJSON()`.

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 17 with PostGIS and pgRouting extensions

### Database Setup

```bash
sudo -u postgres psql -c "CREATE USER routapt WITH PASSWORD 'routapt_dev_2026';"
sudo -u postgres psql -c "CREATE DATABASE routapt OWNER routapt;"
sudo -u postgres psql -d routapt -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d routapt -c "CREATE EXTENSION IF NOT EXISTS pgrouting;"
sudo -u postgres psql -d routapt -c "CREATE EXTENSION IF NOT EXISTS hstore;"
```

### Import OSM Data

```bash
mkdir data && cd data
wget https://download.geofabrik.de/europe/portugal-latest.osm.pbf
osm2pgsql -d routapt -U routapt -H localhost -W \
  --create --slim --drop --latlong --hstore \
  portugal-latest.osm.pbf
```

### Build Routing Topology

```bash
sudo -u postgres psql -d routapt -c "
  ALTER TABLE planet_osm_line ADD COLUMN IF NOT EXISTS gid SERIAL PRIMARY KEY;
  SELECT pgr_createTopology('planet_osm_line', 0.00001, 'way', 'gid');
"
sudo -u postgres psql -d routapt -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO routapt;"
sudo -u postgres psql -d routapt -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO routapt;"
```

### Backend

```bash
cd routapt-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd routapt-frontend
npm install
npm run dev
```

Open `http://localhost:3000` and start navigating Portugal.

---

## Screenshots

> Route calculation from Lisboa to Faro with turn-by-turn directions and network statistics panel.

---

## GIS Concepts Used

- **PostGIS** — Spatial database extension with geometry types, ST\_\* functions, and GiST indexing
- **pgRouting** — Graph-based shortest path algorithms (Dijkstra) running inside PostgreSQL
- **osm2pgsql** — OpenStreetMap data import pipeline with hstore tag support
- **GeoDjango** — Django's geographic framework with spatial model fields and ORM lookups
- **GeoJSON** — Standard format for encoding geographic data structures
- **EPSG:4326** — WGS84 coordinate reference system (standard GPS lat/lon)
- **Spatial indexing** — GiST indexes for sub-second geographic queries on 682K+ road segments

---

## Course Information

|                |                                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Course**     | Sistemas de Informação Geográfica + Projeto Temático em Aplicações SIG |
| **University** | Universidade de Aveiro — ESTGA                                         |
| **Professor**  | Luís Jorge Gonçalves                                                   |
| **Year**       | 2025/2026 — 2nd Semester                                               |

---

## Author

**Kousha Rezaei**

[Portfolio](https://www.kousharezaei.dev) · [GitHub](https://github.com/Koi725)
