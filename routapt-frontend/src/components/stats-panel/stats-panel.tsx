import { IcClose } from "../icons";
import { StatsPanelProps } from "./stats-panel-types";

const COLORS: Record<string, string> = {
  motorway: "#0d9488",
  trunk: "#0f766e",
  primary: "#d97706",
  secondary: "#dc2626",
  tertiary: "#2563eb",
  residential: "#6b7280",
  unclassified: "#9ca3af",
};

export const StatsPanel = ({ data, onClose }: StatsPanelProps) => {
  if (!data) return null;

  const maxKm = Math.max(...data.breakdown.map((b) => b.total_km));

  return (
    <div className="stats-panel">
      <h4>
        Portugal road network
        <button className="x-btn" onClick={onClose}><IcClose size={14} /></button>
      </h4>
      <div className="stat-grid">
        <div className="stat-cell">
          <div className="v mono">{data.total_km.toLocaleString()}<span style={{ fontSize: 12, color: "#888" }}> km</span></div>
          <div className="l">Total road length</div>
        </div>
        <div className="stat-cell">
          <div className="v mono">{data.total_segments.toLocaleString()}</div>
          <div className="l">Segments</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#888", margin: "10px 0 6px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
        By road type
      </div>
      {data.breakdown.map((b, i) => (
        <div key={i} className="bar-row">
          <span className="lbl">{b.highway_type}</span>
          <span className="bar">
            <span style={{ width: `${(b.total_km / maxKm) * 100}%`, background: COLORS[b.highway_type] || "#9ca3af" }} />
          </span>
          <span className="pct mono">{Math.round(b.total_km).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};