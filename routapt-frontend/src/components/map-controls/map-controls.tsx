import { IcPlus, IcMinus, IcGeo, IcCompass } from "../icons";
import { MapControlsProps } from "./map-controls-types";

export const MapControls = ({ onZoomIn, onZoomOut, onLocate }: MapControlsProps) => (
  <div className="controls">
    <div className="ctl-group">
      <button className="ctl" onClick={onZoomIn} aria-label="Zoom in"><IcPlus size={16} /></button>
      <button className="ctl" onClick={onZoomOut} aria-label="Zoom out"><IcMinus size={16} /></button>
    </div>
    <button className="ctl geo" onClick={() => {
      if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser");
        return;
      }
      onLocate();
    }} aria-label="Locate me"><IcGeo size={16} /></button>
    <button className="ctl compass" aria-label="Compass"><IcCompass size={20} /></button>
  </div>
);