# RoutaPT 🗺️

**Smart Road Navigator for Portugal** — A full-stack WebGIS application with real-time routing, incident reporting, and spatial analytics.

> Got a GIS / Geoinformatics course and need a project? I gotchu bruh. 🤝

Built for **Sistemas de Informação Geográfica** + **Projeto Temático em Aplicações SIG** at Universidade de Aveiro (ESTGA). This isn't your average student projectit's a production-grade navigation app powered by Portugal's entire road network (682,612 segments, 169,516 km).

---

## What It Does

🛣️ **Route Calculation** — A-to-B navigation using Dijkstra's algorithm on real OpenStreetMap data. Supports driving, walking, and cycling modes with speed-weighted cost functions.

🔍 **Smart Search** — Search any address in Portugal via Nominatim geocoding + local POI search from the OSM database.

⚠️ **Incident Reporting** — Waze-style crowd-sourced road reports. Drop a pin, select type, set severity, submit.

📍 **POI Layer** — Points of interest with category-specific icons fuel, hospitals, restaurants, parking, pharmacies.

📷 **Speed Cameras** — 294 camera locations from OSM with speed limit info.

🔥 **Heatmap** — Road density visualization across Portugal.

📊 **Network Stats** — Total road km, segment count, breakdown by type.

🚶 **Multi-Modal** — Drive (54 min Aveiro→Porto), walk (17h), bike (5h 40min).

---

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Database | PostgreSQL 17 + PostGIS 3.5 + pgRouting 3.7  |
| Data     | OpenStreetMap (Geofabrik Portugal)           |
| Backend  | Django 5.1 + GeoDjango + DRF                 |
| Frontend | Next.js 16 + React 19 + TypeScript + Leaflet |
| Caching  | Redis 7                                      |
| Tasks    | Celery (incident cleanup + heatmap prefetch) |
| Proxy    | Nginx                                        |
| Infra    | Docker Compose                               |

---

## Quick Start

```bash
git clone https://github.com/Koi725/RoutaPT.git
cd RoutaPT
cp .env.example .env
# Edit .env with your passwords
chmod +x build.sh
./build.sh
# Open http://localhost
```

See **SETUP.md** for detailed instructions including OSM data import.

---

## API Endpoints

| Method   | Endpoint                 | Description                       |
| -------- | ------------------------ | --------------------------------- |
| GET      | /api/routing/route/      | Calculate route (drive/walk/bike) |
| GET      | /api/routing/geocode/    | Search addresses                  |
| GET      | /api/pois/               | POIs in bounding box              |
| GET      | /api/pois/cameras/       | Speed cameras                     |
| GET      | /api/pois/search/        | Search POIs by name               |
| GET/POST | /api/incidents/          | List/create incidents             |
| POST     | /api/incidents/:id/vote/ | Confirm/dismiss                   |
| GET      | /api/heatmap/roads/      | Road density                      |
| GET      | /api/heatmap/stats/      | Network statistics                |

---

## How Routing Works

1. OSM data (52M nodes) imported into PostGIS via osm2pgsql
2. pgRouting builds topology graph (2.1M edges)
3. User requests route → KNN finds nearest road nodes → Dijkstra runs inside PostgreSQL
4. Cost = distance/speed per road type (motorway=120, residential=30 km/h)
5. Edge geometries merged via ST_LineMerge → returned as GeoJSON
6. Redis caches results for 1 hour

---

## Author

**Kousha Rezaei** — [Portfolio](https://www.kodelabs.me) · [GitHub](https://github.com/Koi725)

MIT License — Use it, learn from it. If it helps you pass your GIS course, that's a win. 🎓
