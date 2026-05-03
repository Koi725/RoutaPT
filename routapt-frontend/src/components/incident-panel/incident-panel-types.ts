export interface IncidentFormData {
  incident_type: string;
  severity: string;
  description: string;
  lat: number;
  lon: number;
}

export interface IncidentPanelProps {
  onClose: () => void;
  onSubmit: (data: IncidentFormData) => void;
  pinLocation: { lat: number; lon: number } | null;
  pinDropMode: boolean;
  onPinDropMode: (active: boolean) => void;
}