export interface LayerState {
  pois: boolean;
  cameras: boolean;
  heatmap: boolean;
  incidents: boolean;
  isochrone: boolean;
}

export interface LayerToggleProps {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}