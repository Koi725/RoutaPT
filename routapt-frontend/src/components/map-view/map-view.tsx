"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapViewProps } from "./map-view-types";

export const MapView = ({
  layers,
  routeGeoJSON,
  origin,
  destination,
  pinDropMode,
  onPinDrop,
  onBoundsChange,
}: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const originMarkerRef = useRef<L.CircleMarker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [39.5, -8.0],
      zoom: 7,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© RoutaPT · OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", () => {
      const bounds = map.getBounds();
      onBoundsChange(
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()]
      );
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click for pin drop
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      if (pinDropMode) {
        onPinDrop(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", handler);
    map.getContainer().style.cursor = pinDropMode ? "crosshair" : "";

    return () => {
      map.off("click", handler);
    };
  }, [pinDropMode, onPinDrop]);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeoJSON) {
      const layer = L.geoJSON(routeGeoJSON as any, {
        style: {
          color: "#0d9488",
          weight: 6,
          opacity: 0.85,
        },
      }).addTo(map);

      routeLayerRef.current = layer;
      map.fitBounds(layer.getBounds(), { padding: [80, 80] });
    }
  }, [routeGeoJSON]);

  // Origin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current);
      originMarkerRef.current = null;
    }

    if (origin) {
      const marker = L.circleMarker(origin, {
        radius: 10,
        fillColor: "#0d9488",
        fillOpacity: 1,
        color: "#fff",
        weight: 3,
      }).addTo(map);
      originMarkerRef.current = marker;
    }
  }, [origin]);

  // Destination marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    if (destination) {
      const icon = L.divIcon({
        html: `<svg width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#dc2626" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        className: "",
      });
      const marker = L.marker(destination, { icon }).addTo(map);
      destMarkerRef.current = marker;
    }
  }, [destination]);

  // Expose map controls
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on("locationfound", (e) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        color: "#fff",
        weight: 3,
      }).addTo(map);

      L.circle(e.latlng, {
        radius: e.accuracy / 2,
        fillColor: "#4285F4",
        fillOpacity: 0.1,
        color: "#4285F4",
        weight: 1,
      }).addTo(map);
    });

    map.on("locationerror", (e) => {
      console.error("Location error:", e.message);
    });

     
    (window as any).__routaptMap = {
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      locate: () => map.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true }),
    };
  }, []);

  return <div ref={containerRef} className="map-wrap" />;
};