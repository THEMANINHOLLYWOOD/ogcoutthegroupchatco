import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Airport, searchAirports, formatAirportDisplay, getUserLocationAirport } from "@/lib/airportSearch";
import { cn } from "@/lib/utils";

interface AirportAutocompleteProps {
  value: Airport | null;
  onChange: (airport: Airport) => void;
  placeholder?: string;
  label?: string;
  showGeolocation?: boolean;
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Search airports...",
  label,
  showGeolocation = false,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search airports when query changes
  useEffect(() => {
    const airports = searchAirports(query);
    setResults(airports);
    setHighlightedIndex(0);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((airport: Airport) => {
    onChange(airport);
    setQuery("");
    setIsOpen(false);
  }, [onChange]);

  const handleGeolocation = useCallback(async () => {
    setIsLoadingLocation(true);
    const airport = await getUserLocationAirport();
    setIsLoadingLocation(false);
    if (airport) {
      handleSelect(airport);
    }
  }, [handleSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {value ? (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl border border-border text-left hover:bg-muted/70 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{value.iata}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate">{value.city}</div>
              <div className="text-xs text-muted-foreground truncate">{value.name}</div>
            </div>
          </button>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-12 pl-4 pr-4 rounded-xl bg-muted/50 border-border"
              />
            </div>
            {showGeolocation && (
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLoadingLocation}
                className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50"
                title="Use my location"
              >
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          >
            {results.map((airport, index) => (
              <button
                key={airport.iata}
                type="button"
                onClick={() => handleSelect(airport)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  index === highlightedIndex
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">{airport.iata}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{airport.city}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {airport.name} · {airport.country}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
