"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";

import { Brand } from "@/components/brand";
import { SearchBar } from "@/components/search-bar";
import { LayerToggle, LayerState } from "@/components/layer-toggle";
import { MapControls } from "@/components/map-controls";
import { RouteCard, RouteData } from "@/components/route-card";
import { Fab } from "@/components/fab";
import { StatsPanel, StatsData } from "@/components/stats-panel";
import { IncidentPanel, IncidentFormData } from "@/components/incident-panel";
import { Toast } from "@/components/toast";
import { useToast } from "@/hooks/use-toast";

import { calculateRoute } from "@/lib/routing/routing.api";
import { geocodeSearch } from "@/lib/geocode/geocode.api";
import { createIncident } from "@/lib/incidents/incidents.api";
import { getNetworkStats } from "@/lib/heatmap/heatmap.api";

// Leaflet must be client-side only — no SSR
const MapView = dynamic(() => import("@/components/map-view").then((m) => m.MapView), {
  ssr: false,
});

export default function Home() {
  // Search state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Route state
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeOpen, setRouteOpen] = useState(true);
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  // Layer state
  const [layers, setLayers] = useState<LayerState>({
    pois: true,
    cameras: true,
    heatmap: false,
    incidents: true,
  });

  // Panel state
  const [reportOpen, setReportOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);

  const [isCalculating, setIsCalculating] = useState(false);
  // Pin drop for incidents
  const [pinDropMode, setPinDropMode] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Map bounds
  const [bounds, setBounds] = useState<{ sw: [number, number]; ne: [number, number] } | null>(null);

  // Toast
  const toast = useToast();

  // Toggle layers
  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRoute = useCallback(async () => {
    if (!from || !to) {
      toast.show("Enter origin and destination");
      return;
    }

    try {
      setIsCalculating(true);
      toast.show("Geocoding addresses...");

      const [fromResults, toResults] = await Promise.all([
        geocodeSearch(from),
        geocodeSearch(to),
      ]);

      if (!fromResults.length || !toResults.length) {
        toast.show("Could not find one or both addresses");
        setIsCalculating(false);
        return;
      }

      const fromCoord: [number, number] = [fromResults[0].lat, fromResults[0].lon];
      const toCoord: [number, number] = [toResults[0].lat, toResults[0].lon];

      setOrigin(fromCoord);
      setDestination(toCoord);

      toast.show("Calculating shortest path...");

      const route = await calculateRoute(fromCoord[0], fromCoord[1], toCoord[0], toCoord[1]);
      setRouteData(route);
      setRouteOpen(true);
      setIsCalculating(false);
      toast.show(`Route found — ${route.distance_km} km`);
    } catch (err) {
      setIsCalculating(false);
      toast.show("Route calculation failed");
      console.error(err);
    }
  }, [from, to, toast]);

  // Handle pin drop for incidents
  const handlePinDrop = useCallback((lat: number, lon: number) => {
    setPinLocation({ lat, lon });
    setPinDropMode(false);
  }, []);

  // Submit incident
  const handleIncidentSubmit = useCallback(async (data: IncidentFormData) => {
    try {
      await createIncident(data);
      setReportOpen(false);
      setPinLocation(null);
      toast.show("Incident reported successfully");
    } catch (err) {
      toast.show("Failed to submit incident");
      console.error(err);
    }
  }, [toast]);

  // Load stats
  const handleStatsOpen = useCallback(async () => {
    setStatsOpen(true);
    if (!statsData) {
      try {
        const data = await getNetworkStats();
        setStatsData(data);
      } catch (err) {
        toast.show("Failed to load stats");
      }
    }
  }, [statsData, toast]);

  // Map controls
  const handleZoomIn = () => (window as any).__routaptMap?.zoomIn();
  const handleZoomOut = () => (window as any).__routaptMap?.zoomOut();
  const handleLocate = () => {
    (window as any).__routaptMap?.locate();
    toast.show("Locating you...");
  };

  return (
    <>
      <MapView
        layers={layers}
        routeGeoJSON={routeData?.route || null}
        origin={origin}
        destination={destination}
        pinDropMode={pinDropMode}
        onPinDrop={handlePinDrop}
        onBoundsChange={(sw, ne) => setBounds({ sw, ne })}
      />

      <Brand />

      <SearchBar
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onRoute={handleRoute}
        suggestions={[]}
      />

      <LayerToggle layers={layers} onToggle={toggleLayer} />

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
      />

      <RouteCard
        data={routeData}
        isOpen={routeOpen}
        onToggle={() => setRouteOpen(!routeOpen)}
      />

      {!reportOpen && !statsOpen && (
        <Fab
          onReport={() => setReportOpen(true)}
          onStats={handleStatsOpen}
          totalKm={statsData?.total_km || null}
        />
      )}

      {statsOpen && (
        <StatsPanel data={statsData} onClose={() => setStatsOpen(false)} />
      )}

      {reportOpen && (
        <IncidentPanel
          onClose={() => { setReportOpen(false); setPinLocation(null); setPinDropMode(false); }}
          onSubmit={handleIncidentSubmit}
          pinLocation={pinLocation}
          pinDropMode={pinDropMode}
          onPinDropMode={setPinDropMode}
        />
      )}

      <Toast message={toast.message} />

      {isCalculating && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 1500,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            padding: "32px 40px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
            textAlign: "center",
            animation: "slide-up 0.3s ease",
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: "3px solid #e8e5de",
              borderTopColor: "#0d9488",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>Calculating route</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Finding fastest path via pgRouting...</div>
          </div>
        </div>
      )}
    </>
  );
}