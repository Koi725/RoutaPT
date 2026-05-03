export interface SearchBarProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRoute: () => void;
  suggestions: SearchSuggestion[];
  isLoading?: boolean;
}

export interface SearchSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}