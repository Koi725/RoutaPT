"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapViewProps } from "./map-view-types";
import { getIncidents } from "@/lib/incidents/incidents.api";

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
  const incidentLayerRef = useRef<L.LayerGroup | null>(null);
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

    incidentLayerRef.current = L.layerGroup().addTo(map);

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
        const marker = L.circleMarker(e.latlng, {
          radius: 8,
          fillColor: "#dc2626",
          fillOpacity: 1,
          color: "#fff",
          weight: 3,
        }).addTo(map);
        setTimeout(() => map.removeLayer(marker), 30000);
        onPinDrop(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", handler);
    map.getContainer().style.cursor = pinDropMode ? "crosshair" : "";

    return () => {
      map.off("click", handler);
      map.getContainer().style.cursor = "";
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

  // Load incidents when layer is toggled on
  useEffect(() => {
    const map = mapRef.current;
    const incidentGroup = incidentLayerRef.current;
    if (!map || !incidentGroup) return;

    incidentGroup.clearLayers();

    if (!layers.incidents) return;

    const loadIncidents = async () => {
      const bounds = map.getBounds();
      try {
        const data = await getIncidents(
          bounds.getSouth(), bounds.getWest(),
          bounds.getNorth(), bounds.getEast()
        );

        if (data.features) {
          data.features.forEach((feature: any) => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            const colors: Record<string, string> = {
              accident: "#dc2626",
              roadwork: "#d97706",
              police: "#2563eb",
              hazard: "#f59e0b",
              closure: "#991b1b",
              traffic: "#ea580c",
              weather: "#7c3aed",
            };

            const color = colors[props.incident_type] || "#6b7280";

            const icon = L.divIcon({
              html: `<div style="width:28px;height:28px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 3l10 17H2L12 3z"/><path d="M12 10v4M12 17v.5"/></svg>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              className: "",
            });

            L.marker([coords[1], coords[0]], { icon })
              .bindPopup(`
                <div style="font-family:system-ui;font-size:13px">
                  <strong style="text-transform:capitalize">${props.incident_type}</strong>
                  <span style="font-size:11px;color:#888;margin-left:6px">${props.severity}</span>
                  ${props.description ? `<p style="margin:6px 0 0;color:#666">${props.description}</p>` : ""}
                  <p style="margin:4px 0 0;font-size:11px;color:#999">
                    ${props.confirmations} confirmations · ${props.dismissals} dismissals
                  </p>
                </div>
              `)
              .addTo(incidentGroup);
          });
        }
      } catch (err) {
        console.error("Failed to load incidents:", err);
      }
    };

    loadIncidents();

    map.on("moveend", loadIncidents);
    return () => { map.off("moveend", loadIncidents); };
  }, [layers.incidents]);

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