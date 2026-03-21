-- ══════════════════════════════════════════════
-- RoutaPT — Database initialization
-- Runs once on first container boot via
-- docker-entrypoint-initdb.d
-- ══════════════════════════════════════════════

-- Enable spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;
CREATE EXTENSION IF NOT EXISTS hstore;

-- Verify extensions loaded
SELECT PostGIS_Version();
SELECT pgr_version();