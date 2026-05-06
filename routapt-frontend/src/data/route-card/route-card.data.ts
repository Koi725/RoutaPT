export interface RouteStep {
  instruction: string;
  street: string;
}

export interface RouteData {
  route: GeoJSON.Geometry;
  distance_km: number;
  duration_min: number;
  steps: RouteStep[];
  mode: string;
}

export interface ModeEstimate {
  mode: string;
  duration_min: number;
  label: string;
}

export interface RouteCardProps {
  data: RouteData | null;
  isOpen: boolean;
  onToggle: () => void;
  modeEstimates: ModeEstimate[];
  activeMode: string;
  onModeChange: (mode: string) => void;
}