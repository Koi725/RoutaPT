import { apiFetch } from "../api-config";

export interface POICollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      osm_id: number;
      name: string;
      amenity: string;
      category: string;
    };
    geometry: GeoJSON.Point;
  }>;
}

export interface CameraCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      osm_id: number;
      speed_limit: number;
      direction: string;
    };
    geometry: GeoJSON.Point;
  }>;
}

export async function getPOIs(
  swLat: number,
  swLon: number,
  neLat: number,
  neLon: number,
  category?: string
): Promise<POICollection> {
  let url = `/api/pois/?sw_lat=${swLat}&sw_lon=${swLon}&ne_lat=${neLat}&ne_lon=${neLon}`;
  if (category && category !== "all") url += `&category=${category}`;
  return apiFetch<POICollection>(url);
}

export async function getCameras(
  swLat: number,
  swLon: number,
  neLat: number,
  neLon: number
): Promise<CameraCollection> {
  return apiFetch<CameraCollection>(
    `/api/pois/cameras/?sw_lat=${swLat}&sw_lon=${swLon}&ne_lat=${neLat}&ne_lon=${neLon}`
  );
}