import { IsochronePanelProps } from "./isochrone-panel-types";

const DISTANCE_OPTIONS_M = [
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "20 km", value: 20000 },
];
const TIME_OPTIONS_MIN = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
];

export const IsochronePanel = ({
  mode,
  value,
  onModeChange,
  onValueChange,
  reachableFacilities,
  loading,
  error,
  onClear,
}: IsochronePanelProps) => {
  const opts = mode === "time" ? TIME_OPTIONS_MIN : DISTANCE_OPTIONS_M;
  const unit = mode === "time" ? "min" : "km";
  const valueLabel = mode === "time" ? `${value} min` : `${value / 1000} km`;

  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        right: 16,
        zIndex: 900,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
        minWidth: 240,
        fontFamily: "system-ui",
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <strong style={{ fontSize: 14, color: "#0d9488", letterSpacing: "-0.01em" }}>Reachability</strong>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "none",
            color: "#888",
            fontSize: 11,
            cursor: "pointer",
            padding: 0,
          }}
          title="Clear isochrone"
        >
          Clear
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 10, background: "#f4f4f0", borderRadius: 8, padding: 3 }}>
        {(["distance", "time"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              background: mode === m ? "#fff" : "transparent",
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              color: mode === m ? "#0d9488" : "#666",
              fontWeight: mode === m ? 600 : 500,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => onValueChange(o.value)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: value === o.value ? "1.5px solid #0d9488" : "1px solid #e8e5de",
              background: value === o.value ? "rgba(13,148,136,0.08)" : "#fff",
              color: value === o.value ? "#0d9488" : "#444",
              fontSize: 12,
              fontWeight: value === o.value ? 600 : 500,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#888", marginBottom: reachableFacilities !== null || loading || error ? 10 : 0 }}>
        Click anywhere on the map to draw the area reachable within {valueLabel}.
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "#0d9488", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, border: "2px solid #e8e5de", borderTopColor: "#0d9488", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Computing isochrone…
        </div>
      )}

      {error && !loading && (
        <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>
      )}

      {reachableFacilities !== null && !loading && !error && (
        <div
          style={{
            marginTop: 4,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(13,148,136,0.08)",
            border: "1px solid rgba(13,148,136,0.2)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0d9488", lineHeight: 1 }}>
            {reachableFacilities}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
            hospitals/clinics reachable within {valueLabel}
          </div>
        </div>
      )}
    </div>
  );
};
