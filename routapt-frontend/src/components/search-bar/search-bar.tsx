"use client";

import { useState, useEffect } from "react";
import { IcSwap, IcArrow, IcPin, IcSparkle } from "../icons";
import { SearchBarProps } from "./search-bar-types";
import { geocodeSearch, GeocodeResult } from "@/lib/geocode/geocode.api";
import { useDebounce } from "@/hooks/use-debounce";

export const SearchBar = ({ from, to, onFromChange, onToChange, onRoute }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [spin, setSpin] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to">("to");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);

  const searchQuery = activeField === "from" ? from : to;
  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    geocodeSearch(debouncedQuery)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  const swap = () => {
    setSpin(true);
    setTimeout(() => setSpin(false), 300);
    const a = from, b = to;
    onFromChange(b);
    onToChange(a);
  };

  const selectSuggestion = (s: GeocodeResult) => {
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
              <div className="ac-icon"><IcPin size={14} /></div>
              <div className="ac-main">
                <div className="ac-title">{s.display_name.split(",")[0]}</div>
                <div className="ac-sub">{s.display_name.split(",").slice(1, 3).join(",")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};