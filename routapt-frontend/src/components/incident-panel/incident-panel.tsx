"use client";

import { useState } from "react";
import { IcClose, IcAlert, IcCar, IcCone, IcShield, IcBlock, IcCloud, IcInfo, IcPin } from "../icons";
import { IncidentPanelProps } from "./incident-panel-types";
import { INCIDENT_TYPES } from "@/data/incident-panel/incident-panel.data";

export const IncidentPanel = ({ onClose, onSubmit, pinLocation, pinDropMode, onPinDropMode }: IncidentPanelProps) => {
  const [type, setType] = useState("accident");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!pinLocation) return;
    onSubmit({
      incident_type: type,
      severity,
      description,
      lat: pinLocation.lat,
      lon: pinLocation.lon,
    });
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-head">
          <div>
            <h3>Report an incident</h3>
            <p>Help drivers around you. Reports are anonymous.</p>
          </div>
          <button className="x-btn" onClick={onClose}><IcClose size={14} /></button>
        </div>
        <div className="sheet-body">
          <div className="field-label">Type</div>
          <div className="type-grid">
            {INCIDENT_TYPES.map((t) => (
              <button
                key={t.key}
                className={`type-card ${type === t.key ? "active" : ""}`}
                onClick={() => setType(t.key)}
              >
                <span className="ic" style={{ background: t.color }}>{t.icon}</span>
                <span className="lbl">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="field-label">Severity</div>
          <div className="severity">
            {(["low", "medium", "high"] as const).map((s) => (
              <button
                key={s}
                className={`sev-btn ${s} ${severity === s ? "active" : ""}`}
                onClick={() => setSeverity(s)}
              >
                <span className="pip" />
                {s === "low" ? "Minor" : s === "medium" ? "Moderate" : "Major"}
              </button>
            ))}
          </div>

          <div className="field-label">Location</div>
          <div
            className={`pin-hint ${pinLocation ? "set" : ""}`}
            onClick={() => onPinDropMode(true)}
            style={{ cursor: "pointer" }}
          >
            <IcPin size={14} />
            {pinLocation
              ? <>Pin set on map <span className="mono">{pinLocation.lat.toFixed(4)}, {pinLocation.lon.toFixed(4)}</span></>
              : <>{pinDropMode ? "Click on the map to drop a pin" : "Tap, then click the map to drop a pin"}</>
            }
          </div>

          <div className="field-label">Description (optional)</div>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Two vehicles, right lane blocked. Police on scene."
          />
        </div>
        <div className="sheet-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn coral" onClick={handleSubmit}>
            <IcAlert size={14} /> Submit report
          </button>
        </div>
      </div>
    </>
  );
};