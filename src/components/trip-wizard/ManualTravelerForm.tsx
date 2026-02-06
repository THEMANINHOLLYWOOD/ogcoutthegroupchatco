import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { Airport } from "@/lib/airportSearch";

interface ManualTravelerFormProps {
  defaultOrigin: Airport;
  onAdd: (name: string, origin: Airport) => void;
  onCancel: () => void;
}

export function ManualTravelerForm({
  defaultOrigin,
  onAdd,
  onCancel,
}: ManualTravelerFormProps) {
  const [name, setName] = useState("");
  const [sameAirport, setSameAirport] = useState(true);
  const [customOrigin, setCustomOrigin] = useState<Airport | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    const origin = sameAirport ? defaultOrigin : customOrigin;
    if (!origin) return;
    onAdd(name.trim(), origin);
  };

  const canSubmit = name.trim() && (sameAirport || customOrigin);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-muted/30 rounded-2xl p-4 mb-6 space-y-4 overflow-hidden"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Traveler's name"
        className="h-12 rounded-xl bg-background"
        autoFocus
      />

      {/* Same Airport Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">
          Flying from {defaultOrigin.iata}?
        </span>
        <Switch
          checked={sameAirport}
          onCheckedChange={setSameAirport}
        />
      </div>

      {/* Custom Origin */}
      {!sameAirport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AirportAutocomplete
            value={customOrigin}
            onChange={setCustomOrigin}
            placeholder="Where are they flying from?"
          />
        </motion.div>
      )}

      {/* Form Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          disabled={!canSubmit}
          className="flex-1 rounded-xl"
        >
          Add
        </Button>
      </div>
    </motion.div>
  );
}
