import { apiFetch } from "../api-config";

export interface HeatmapPoint {
  lat: number;
  lon: number;
  weight: number;
}

export interface NetworkStats {
  total_km: number;
  total_segments: number;
  breakdown: Array<{
    highway_type: string;
    segment_count: number;
    total_km: number;
  }>;
}

export async function getRoadDensity(
  resolution?: number
): Promise<HeatmapPoint[]> {
  const res = resolution || 0.01;
  return apiFetch<HeatmapPoint[]>(
    `/api/heatmap/roads/?resolution=${res}`
  );
}

export async function getIncidentDensity(
  days?: number
): Promise<HeatmapPoint[]> {
  const d = days || 30;
  return apiFetch<HeatmapPoint[]>(
    `/api/heatmap/incidents/?days=${d}`
  );
}

export async function getNetworkStats(): Promise<NetworkStats> {
  return apiFetch<NetworkStats>("/api/heatmap/stats/");
}