import { apiFetch } from "../api-config";

export interface Incident {
  id: number;
  type: string;
  properties: {
    incident_type: string;
    severity: string;
    description: string;
    confirmations: number;
    dismissals: number;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    expires_at: string;
  };
  geometry: GeoJSON.Point;
}

export interface IncidentCollection {
  type: "FeatureCollection";
  features: Incident[];
}

export async function getIncidents(
  swLat: number,
  swLon: number,
  neLat: number,
  neLon: number,
  type?: string
): Promise<IncidentCollection> {
  let url = `/api/incidents/?sw_lat=${swLat}&sw_lon=${swLon}&ne_lat=${neLat}&ne_lon=${neLon}`;
  if (type && type !== "all") url += `&incident_type=${type}`;
  return apiFetch<IncidentCollection>(url);
}

export async function createIncident(data: {
  incident_type: string;
  severity: string;
  description: string;
  lat: number;
  lon: number;
}): Promise<Incident> {
  return apiFetch<Incident>("/api/incidents/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function voteIncident(
  id: number,
  vote: "confirm" | "dismiss"
): Promise<Incident> {
  return apiFetch<Incident>(`/api/incidents/${id}/vote/`, {
    method: "POST",
    body: JSON.stringify({ vote }),
  });
}