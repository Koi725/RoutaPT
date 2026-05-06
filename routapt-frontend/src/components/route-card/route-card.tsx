import { IcChevD, IcChevU, IcManeuverStraight, IcManeuverRight, IcArrive, IcCar, IcWalk, IcBike } from "../icons";
import { RouteCardProps } from "./route-card-types";

const MODE_ICONS: Record<string, React.ReactNode> = {
  drive: <IcCar size={13} />,
  walk: <IcWalk size={13} />,
  bike: <IcBike size={13} />,
};

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}` : `${m}`;
};

export const RouteCard = ({ data, isOpen, onToggle, modeEstimates, activeMode, onModeChange }: RouteCardProps) => {
  if (!data) return null;

  return (
    <div className="route-card" style={{ maxHeight: isOpen ? "min(560px, calc(100vh - 100px))" : "110px" }}>
      <div className="rc-head">
        <div className="rc-stats">
          <div className="rc-time">
            {formatDuration(data.duration_min)}<small> min</small>
          </div>
          <div>
            <div className="rc-dist mono">{data.distance_km} km</div>
            <div style={{ marginTop: 4 }}>
              <span className="rc-eta">
                Arrives {new Date(Date.now() + data.duration_min * 60000).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
        <button className="rc-toggle" onClick={onToggle} aria-label="Toggle directions">
          {isOpen ? <IcChevD size={16} /> : <IcChevU size={16} />}
        </button>
      </div>

      <div className="rc-modes">
        {modeEstimates.map((est) => (
          <button
            key={est.mode}
            className={`rc-mode ${activeMode === est.mode ? "active" : ""}`}
            onClick={() => onModeChange(est.mode)}
          >
            {MODE_ICONS[est.mode]}
            {formatDuration(est.duration_min)} min
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="rc-steps">
          {data.steps.map((step, i) => (
            <div key={i} className="rc-step">
              <div className="icon">
                {i === data.steps.length - 1 ? <IcArrive size={16} /> :
                 step.instruction.toLowerCase().includes("right") ? <IcManeuverRight size={16} /> :
                 <IcManeuverStraight size={16} />}
              </div>
              <div className="text">
                {step.instruction}
                <small>{step.street}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};