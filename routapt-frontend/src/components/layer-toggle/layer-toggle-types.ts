export interface LayerState {
  pois: boolean;
  cameras: boolean;
  heatmap: boolean;
  incidents: boolean;
}

export interface LayerToggleProps {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}