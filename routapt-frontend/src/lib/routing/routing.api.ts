import { apiFetch } from "../api-config";

export interface RouteResponse {
  route: GeoJSON.Geometry;
  distance_km: number;
  duration_min: number;
  steps: { instruction: string; street: string }[];
  mode: string;
}

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lon: number;
}

export interface POISearchResult {
  display_name: string;
  category: string;
  lat: number;
  lon: number;
}

export type TravelMode = 'drive' | 'walk' | 'bike';

export async function calculateRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  mode: TravelMode = 'drive'
): Promise<RouteResponse> {
  return apiFetch<RouteResponse>(
    `/api/routing/route/?from_lat=${fromLat}&from_lon=${fromLon}&to_lat=${toLat}&to_lon=${toLon}&mode=${mode}`
  );
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  return apiFetch<GeocodeResult[]>(
    `/api/routing/geocode/?q=${encodeURIComponent(query)}`
  );
}

export async function searchPOIs(query: string): Promise<POISearchResult[]> {
  return apiFetch<POISearchResult[]>(
    `/api/pois/search/?q=${encodeURIComponent(query)}`
  );
}