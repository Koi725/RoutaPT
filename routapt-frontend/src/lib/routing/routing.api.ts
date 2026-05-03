import { apiFetch } from "../api-config";

export interface RouteResponse {
  route: GeoJSON.Geometry;
  distance_km: number;
  duration_min: number;
  steps: { instruction: string; street: string }[];
}

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lon: number;
}

export async function calculateRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<RouteResponse> {
  return apiFetch<RouteResponse>(
    `/api/routing/route/?from_lat=${fromLat}&from_lon=${fromLon}&to_lat=${toLat}&to_lon=${toLon}`
  );
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  return apiFetch<GeocodeResult[]>(
    `/api/routing/geocode/?q=${encodeURIComponent(query)}`
  );
}