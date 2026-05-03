import { IcCar, IcCone, IcShield, IcAlert, IcBlock, IcCloud, IcInfo } from "@/components/icons";
import React from "react";

export const INCIDENT_TYPES = [
  { key: "accident", label: "Accident", color: "#dc2626", icon: React.createElement(IcCar, { size: 16 }) },
  { key: "roadwork", label: "Roadwork", color: "#d97706", icon: React.createElement(IcCone, { size: 16 }) },
  { key: "police", label: "Police", color: "#2563eb", icon: React.createElement(IcShield, { size: 16 }) },
  { key: "hazard", label: "Hazard", color: "#f59e0b", icon: React.createElement(IcAlert, { size: 16 }) },
  { key: "closure", label: "Closure", color: "#991b1b", icon: React.createElement(IcBlock, { size: 16 }) },
  { key: "traffic", label: "Traffic", color: "#ea580c", icon: React.createElement(IcCar, { size: 16 }) },
  { key: "weather", label: "Weather", color: "#7c3aed", icon: React.createElement(IcCloud, { size: 16 }) },
  { key: "other", label: "Other", color: "#6b7280", icon: React.createElement(IcInfo, { size: 16 }) },
];