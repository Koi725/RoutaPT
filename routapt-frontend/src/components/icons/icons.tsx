import { IconProps } from "./icons-types";

const Ico = ({
  d,
  size = 18,
  fill = "none",
  strokeWidth = 1.6,
  className = "",
}: IconProps & { d: React.ReactNode; fill?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {d}
  </svg>
);

export const IcSearch = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-3.6-3.6" /></>} />
);
export const IcArrow = (p: IconProps) => (
  <Ico {...p} d={<><path d="M5 12h14M13 6l6 6-6 6" /></>} />
);
export const IcSwap = (p: IconProps) => (
  <Ico {...p} d={<><path d="M7 4v15M3 8l4-4 4 4" /><path d="M17 20V5M21 16l-4 4-4-4" /></>} />
);
export const IcChevD = (p: IconProps) => (
  <Ico {...p} d={<path d="M6 9l6 6 6-6" />} />
);
export const IcChevU = (p: IconProps) => (
  <Ico {...p} d={<path d="M6 15l6-6 6 6" />} />
);
export const IcClose = (p: IconProps) => (
  <Ico {...p} d={<><path d="M6 6l12 12M18 6L6 18" /></>} />
);
export const IcPlus = (p: IconProps) => (
  <Ico {...p} d={<><path d="M12 5v14M5 12h14" /></>} />
);
export const IcMinus = (p: IconProps) => (
  <Ico {...p} d={<path d="M5 12h14" />} />
);
export const IcGeo = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>} />
);
export const IcCompass = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="12" cy="12" r="9" /></>} />
);
export const IcCamera = (p: IconProps) => (
  <Ico {...p} d={<><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3" /></>} />
);
export const IcPin = (p: IconProps) => (
  <Ico {...p} d={<><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></>} />
);
export const IcFire = (p: IconProps) => (
  <Ico {...p} d={<path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C8 9 9 6 12 3z" />} />
);
export const IcAlert = (p: IconProps) => (
  <Ico {...p} d={<><path d="M12 3l10 17H2L12 3z" /><path d="M12 10v4M12 17v.5" /></>} />
);
export const IcRoad = (p: IconProps) => (
  <Ico {...p} d={<><path d="M6 21l3-18M18 21l-3-18" /><path d="M12 5v2M12 11v2M12 17v2" /></>} />
);
export const IcCone = (p: IconProps) => (
  <Ico {...p} d={<><path d="M9 19l3-13 3 13M5 19h14" /><path d="M10 11h4M9 15h6" /></>} />
);
export const IcShield = (p: IconProps) => (
  <Ico {...p} d={<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />} />
);
export const IcCloud = (p: IconProps) => (
  <Ico {...p} d={<><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A4 4 0 0 1 17 18H7z" /><path d="M9 21l1-2M14 21l1-2" /></>} />
);
export const IcBlock = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5l13 13" /></>} />
);
export const IcCar = (p: IconProps) => (
  <Ico {...p} d={<><path d="M5 17h14l-2-7H7l-2 7z" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></>} />
);
export const IcFuel = (p: IconProps) => (
  <Ico {...p} d={<><path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h14" /><path d="M16 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 1-3 0v-2" /></>} />
);
export const IcMed = (p: IconProps) => (
  <Ico {...p} d={<><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M12 10v6M9 13h6" /></>} />
);
export const IcWalk = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="13" cy="4" r="1.5" /><path d="M9 21l3-7-3-3 4-4 3 5 4 1" /></>} />
);
export const IcBike = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M9 17l3-7 4 7M12 6l4 4" /></>} />
);
export const IcBus = (p: IconProps) => (
  <Ico {...p} d={<><rect x="5" y="4" width="14" height="14" rx="2" /><path d="M5 12h14M9 18v2M15 18v2" /><circle cx="9" cy="15" r=".5" /><circle cx="15" cy="15" r=".5" /></>} />
);
export const IcChart = (p: IconProps) => (
  <Ico {...p} d={<><path d="M4 20V8M10 20V4M16 20v-8M22 20H2" /></>} />
);
export const IcInfo = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11v6" /></>} />
);
export const IcSparkle = (p: IconProps) => (
  <Ico {...p} strokeWidth={1.4} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />} />
);
export const IcManeuverStraight = (p: IconProps) => (
  <Ico {...p} d={<><path d="M12 20V5M7 10l5-5 5 5" /></>} />
);
export const IcManeuverRight = (p: IconProps) => (
  <Ico {...p} d={<><path d="M5 19v-7a4 4 0 0 1 4-4h10M15 4l4 4-4 4" /></>} />
);
export const IcManeuverSlightL = (p: IconProps) => (
  <Ico {...p} d={<><path d="M16 20l-8-8V5M4 9l4-4 4 4" /></>} />
);
export const IcRoundabout = (p: IconProps) => (
  <Ico {...p} d={<><circle cx="12" cy="11" r="4" /><path d="M12 20v-5M16 11h4" /></>} />
);
export const IcArrive = (p: IconProps) => (
  <Ico {...p} d={<><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" /><path d="M9 9l2 2 4-4" /></>} />
);