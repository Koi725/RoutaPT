import { IsochroneMode } from "@/lib/routing/routing.api";

export interface IsochronePanelProps {
  mode: IsochroneMode;
  value: number;
  onModeChange: (mode: IsochroneMode) => void;
  onValueChange: (value: number) => void;
  reachableFacilities: number | null;
  loading: boolean;
  error: string | null;
  onClear: () => void;
}
