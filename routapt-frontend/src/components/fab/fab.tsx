import { IcChart, IcAlert } from "../icons";
import { FabProps } from "./fab-types";

export const Fab = ({ onReport, onStats, totalKm }: FabProps) => (
  <div className="fab-stack">
    <button className="stats-pill" onClick={onStats}>
      <IcChart size={14} /> Network stats
      {totalKm && <span className="badge mono">{totalKm.toLocaleString()} km</span>}
    </button>
    <button className="fab" onClick={onReport} aria-label="Report incident">
      <IcAlert size={22} />
    </button>
  </div>
);