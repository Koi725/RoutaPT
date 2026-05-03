import { IcChevD, IcChevU, IcManeuverStraight, IcManeuverRight, IcArrive } from "../icons";
import { RouteCardProps } from "./route-card-types";

export const RouteCard = ({ data, isOpen, onToggle }: RouteCardProps) => {
  if (!data) return null;

  const hours = Math.floor(data.duration_min / 60);
  const mins = Math.round(data.duration_min % 60);
  const timeDisplay = hours > 0 ? `${hours}h ${mins}` : `${mins}`;

  return (
    <div className="route-card" style={{ maxHeight: isOpen ? "min(560px, calc(100vh - 100px))" : "80px" }}>
      <div className="rc-head">
        <div className="rc-stats">
          <div className="rc-time">
            {timeDisplay}<small> min</small>
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

      {isOpen && (
        <div className="rc-steps">
          {data.steps.map((step, i) => (
            <div key={i} className="rc-step">
              <div className="icon">
                {i === data.steps.length - 1 ? <IcArrive size={16} /> :
                 step.instruction.includes("right") ? <IcManeuverRight size={16} /> :
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