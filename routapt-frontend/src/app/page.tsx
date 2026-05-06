"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";

import { Brand } from "@/components/brand";
import { SearchBar } from "@/components/search-bar";
import { LayerToggle, LayerState } from "@/components/layer-toggle";
import { MapControls } from "@/components/map-controls";
import { RouteCard, RouteData, ModeEstimate } from "@/components/route-card";
import { Fab } from "@/components/fab";
import { StatsPanel, StatsData } from "@/components/stats-panel";
import { IncidentPanel, IncidentFormData } from "@/components/incident-panel";
import { Toast } from "@/components/toast";
import { useToast } from "@/hooks/use-toast";

import { calculateRoute, geocodeSearch, TravelMode } from "@/lib/routing/routing.api";
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
  const [activeMode, setActiveMode] = useState<string>("drive");
  const [modeEstimates, setModeEstimates] = useState<ModeEstimate[]>([]);

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

  // Loading state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcStep, setCalcStep] = useState(0);

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

  // Calculate route with all three modes
  const handleRoute = useCallback(async () => {
    if (!from || !to) {
      toast.show("Enter origin and destination");
      return;
    }

    try {
      setIsCalculating(true);
      setCalcStep(1);

      const [fromResults, toResults] = await Promise.all([
        geocodeSearch(from),
        geocodeSearch(to),
      ]);

      if (!fromResults.length || !toResults.length) {
        toast.show("Could not find one or both addresses");
        setIsCalculating(false);
        setCalcStep(0);
        return;
      }

      setCalcStep(2);
      const fromCoord: [number, number] = [fromResults[0].lat, fromResults[0].lon];
      const toCoord: [number, number] = [toResults[0].lat, toResults[0].lon];
      setOrigin(fromCoord);
      setDestination(toCoord);

      setCalcStep(3);
      await new Promise(r => setTimeout(r, 400));

      setCalcStep(4);

      // Calculate all three modes in parallel
      const [driveRoute, walkRoute, bikeRoute] = await Promise.allSettled([
        calculateRoute(fromCoord[0], fromCoord[1], toCoord[0], toCoord[1], "drive"),
        calculateRoute(fromCoord[0], fromCoord[1], toCoord[0], toCoord[1], "walk"),
        calculateRoute(fromCoord[0], fromCoord[1], toCoord[0], toCoord[1], "bike"),
      ]);

      setCalcStep(5);
      await new Promise(r => setTimeout(r, 300));

      // Use drive as primary
      const primaryRoute = driveRoute.status === "fulfilled" ? driveRoute.value : null;

      if (!primaryRoute) {
        toast.show("Route calculation failed");
        setIsCalculating(false);
        setCalcStep(0);
        return;
      }

      setRouteData(primaryRoute);
      setActiveMode("drive");
      setRouteOpen(true);

      // Build mode estimates from successful results
      const estimates: ModeEstimate[] = [];
      if (driveRoute.status === "fulfilled") estimates.push({ mode: "drive", duration_min: driveRoute.value.duration_min, label: "Drive" });
      if (walkRoute.status === "fulfilled") estimates.push({ mode: "walk", duration_min: walkRoute.value.duration_min, label: "Walk" });
      if (bikeRoute.status === "fulfilled") estimates.push({ mode: "bike", duration_min: bikeRoute.value.duration_min, label: "Bike" });
      setModeEstimates(estimates);

      setIsCalculating(false);
      setCalcStep(0);
      toast.show(`Route found — ${primaryRoute.distance_km} km`);
    } catch (err) {
      setIsCalculating(false);
      setCalcStep(0);
      toast.show("Route calculation failed");
      console.error(err);
    }
  }, [from, to, toast]);

  // Switch travel mode
  const handleModeChange = useCallback(async (mode: string) => {
    if (!origin || !destination) return;
    setActiveMode(mode);
    toast.show(`Switching to ${mode} route...`);

    try {
      const route = await calculateRoute(origin[0], origin[1], destination[0], destination[1], mode as TravelMode);
      setRouteData(route);
    } catch (err) {
      toast.show(`${mode} route not available`);
    }
  }, [origin, destination, toast]);

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
        modeEstimates={modeEstimates}
        activeMode={activeMode}
        onModeChange={handleModeChange}
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
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fade-in 0.2s ease",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: 22,
            padding: "36px 44px",
            boxShadow: "0 12px 48px rgba(0,0,0,0.1)",
            textAlign: "center",
            animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1)",
            minWidth: 300,
          }}>
            <div style={{
              width: 52,
              height: 52,
              border: "3px solid #e8e5de",
              borderTopColor: "#0d9488",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
              {calcStep <= 1 && "Geocoding addresses"}
              {calcStep === 2 && "Addresses resolved"}
              {calcStep === 3 && "Connecting to road network"}
              {calcStep === 4 && "Running Dijkstra algorithm"}
              {calcStep === 5 && "Building route geometry"}
            </div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 6 }}>
              {calcStep <= 1 && "Looking up coordinates for your locations..."}
              {calcStep === 2 && "Found both points on the map"}
              {calcStep === 3 && "Locating nearest road nodes in Portugal..."}
              {calcStep === 4 && "Analyzing 682,612 road segments for optimal path..."}
              {calcStep === 5 && "Merging road geometries into route line..."}
            </div>
            <div style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              marginTop: 20,
            }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} style={{
                  width: s <= calcStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: s <= calcStep ? "#0d9488" : "#e8e5de",
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}