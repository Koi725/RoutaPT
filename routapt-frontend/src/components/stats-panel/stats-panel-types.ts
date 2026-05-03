export interface StatsData {
  total_km: number;
  total_segments: number;
  breakdown: Array<{
    highway_type: string;
    segment_count: number;
    total_km: number;
  }>;
}

export interface StatsPanelProps {
  data: StatsData | null;
  onClose: () => void;
}