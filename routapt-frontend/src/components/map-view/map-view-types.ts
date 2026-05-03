import { LayerState } from "../layer-toggle/layer-toggle-types";

export interface MapViewProps {
  layers: LayerState;
  routeGeoJSON: GeoJSON.Geometry | null;
  origin: [number, number] | null;
  destination: [number, number] | null;
  pinDropMode: boolean;
  onPinDrop: (lat: number, lon: number) => void;
  onBoundsChange: (sw: [number, number], ne: [number, number]) => void;
}