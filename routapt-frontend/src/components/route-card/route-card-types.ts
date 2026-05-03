export interface RouteStep {
  instruction: string;
  street: string;
}

export interface RouteData {
  route: GeoJSON.Geometry;
  distance_km: number;
  duration_min: number;
  steps: RouteStep[];
}

export interface RouteCardProps {
  data: RouteData | null;
  isOpen: boolean;
  onToggle: () => void;
}