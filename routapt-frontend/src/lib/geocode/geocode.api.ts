import { apiFetch } from "../api-config";

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lon: number;
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  return apiFetch<GeocodeResult[]>(
    `/api/routing/geocode/?q=${encodeURIComponent(query)}`
  );
}