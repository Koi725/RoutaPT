"use client";

import { useState, useEffect } from "react";
import { IcSwap, IcArrow, IcPin, IcFuel } from "../icons";
import { SearchBarProps } from "./search-bar-types";
import { geocodeSearch, searchPOIs, GeocodeResult } from "@/lib/routing/routing.api";
import { useDebounce } from "@/hooks/use-debounce";

interface CombinedResult {
  display_name: string;
  lat: number;
  lon: number;
  source: 'geocode' | 'poi';
  category?: string;
}

export const SearchBar = ({ from, to, onFromChange, onToChange, onRoute }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [spin, setSpin] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to">("to");
  const [suggestions, setSuggestions] = useState<CombinedResult[]>([]);

  const searchQuery = activeField === "from" ? from : to;
  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      Promise.resolve().then(() => setSuggestions([]));
      return;
    }

    Promise.all([
      geocodeSearch(debouncedQuery).catch(() => []),
      searchPOIs(debouncedQuery).catch(() => []),
    ]).then(([geo, pois]) => {
      const combined: CombinedResult[] = [
        ...pois.slice(0, 3).map(p => ({
          display_name: p.display_name,
          lat: p.lat,
          lon: p.lon,
          source: 'poi' as const,
          category: p.category,
        })),
        ...geo.slice(0, 4).map(g => ({
          display_name: g.display_name,
          lat: g.lat,
          lon: g.lon,
          source: 'geocode' as const,
        })),
      ];
      setSuggestions(combined);
    });
  }, [debouncedQuery]);

  const swap = () => {
    setSpin(true);
    setTimeout(() => setSpin(false), 300);
    const a = from, b = to;
    onFromChange(b);
    onToChange(a);
  };

  const selectSuggestion = (s: CombinedResult) => {
    if (activeField === "from") {
      onFromChange(s.display_name);
    } else {
      onToChange(s.display_name);
    }
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="search">
      <div className="search-pill">
        <label className="search-input from">
          <span className="dot" />
          <input
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            placeholder="Where from?"
            onFocus={() => { setOpen(true); setActiveField("from"); }}
          />
        </label>
        <button className={`swap-btn ${spin ? "spin" : ""}`} onClick={swap} aria-label="Swap">
          <IcSwap size={14} />
        </button>
        <label className="search-input to">
          <span className="dot" />
          <input
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            placeholder="Where to?"
            onFocus={() => { setOpen(true); setActiveField("to"); }}
          />
        </label>
        <button className="go-btn" onClick={() => { setOpen(false); onRoute(); }}>
          Route <IcArrow size={14} />
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="autocomplete">
          {suggestions.map((s, i) => (
            <div key={i} className="ac-row" onClick={() => selectSuggestion(s)}>
              <div className="ac-icon" style={s.source === 'poi' ? { background: 'rgba(13,148,136,0.1)', color: '#0d9488' } : {}}>
                {s.source === 'poi' ? <IcFuel size={14} /> : <IcPin size={14} />}
              </div>
              <div className="ac-main">
                <div className="ac-title">{s.display_name}</div>
                <div className="ac-sub">{s.source === 'poi' ? s.category : s.display_name.split(",").slice(1, 3).join(",")}</div>
              </div>
              {s.source === 'poi' && <span className="ac-meta">POI</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};