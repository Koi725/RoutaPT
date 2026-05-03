import { IcPin, IcCamera, IcFire, IcAlert } from "../icons";
import { LayerToggleProps, LayerState } from "./layer-toggle-types";

const LAYER_ITEMS: Array<{
  key: keyof LayerState;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  { key: "pois", label: "POIs", tooltip: "Show points of interest (fuel, hospitals, parking)", icon: <IcPin size={13} />, accent: "" },
  { key: "cameras", label: "Cameras", tooltip: "Show speed camera locations on the map", icon: <IcCamera size={13} />, accent: "accent-blue" },
  { key: "heatmap", label: "Heatmap", tooltip: "Show road density heatmap overlay", icon: <IcFire size={13} />, accent: "accent-coral" },
  { key: "incidents", label: "Incidents", tooltip: "Show reported road incidents", icon: <IcAlert size={13} />, accent: "accent-amber" },
];

export const LayerToggle = ({ layers, onToggle }: LayerToggleProps) => (
  <div className="layers">
    {LAYER_ITEMS.map((item) => (
      <button
        key={item.key}
        className={`layer-btn ${layers[item.key] ? "on " + item.accent : ""}`}
        onClick={() => onToggle(item.key)}
        title={item.tooltip}
      >
        {item.icon}
        <span>{item.label}</span>
      </button>
    ))}
  </div>
);