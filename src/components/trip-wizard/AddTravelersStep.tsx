import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TravelerCard } from "./TravelerCard";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { Airport } from "@/lib/airportSearch";
import { Traveler } from "@/lib/tripTypes";
import { TravelerInfo } from "@/lib/idExtraction";

interface AddTravelersStepProps {
  organizer: TravelerInfo;
  defaultOrigin: Airport;
  destination: Airport;
  onContinue: (travelers: Traveler[]) => void;
  onBack: () => void;
}

export function AddTravelersStep({
  organizer,
  defaultOrigin,
  destination,
  onContinue,
  onBack,
}: AddTravelersStepProps) {
  const [travelers, setTravelers] = useState<Traveler[]>([
    {
      id: "organizer",
      name: `${organizer.first_name || ""} ${organizer.last_name || ""}`.trim() || "You",
      origin: defaultOrigin,
      isOrganizer: true,
    },
  ]);
  
  const [isAddingTraveler, setIsAddingTraveler] = useState(false);
  const [newTravelerName, setNewTravelerName] = useState("");
  const [sameAirport, setSameAirport] = useState(true);
  const [customOrigin, setCustomOrigin] = useState<Airport | null>(null);

  const addTraveler = useCallback(() => {
    if (!newTravelerName.trim()) return;

    const origin = sameAirport ? defaultOrigin : customOrigin;
    if (!origin) return;

    const newTraveler: Traveler = {
      id: crypto.randomUUID(),
      name: newTravelerName.trim(),
      origin,
      isOrganizer: false,
    };

    setTravelers((prev) => [...prev, newTraveler]);
    setNewTravelerName("");
    setIsAddingTraveler(false);
    setSameAirport(true);
    setCustomOrigin(null);
  }, [newTravelerName, sameAirport, defaultOrigin, customOrigin]);

  const removeTraveler = useCallback((id: string) => {
    setTravelers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleContinue = () => {
    onContinue(travelers);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
          Who's coming along?
        </h1>
        <p className="text-muted-foreground text-lg">
          Add friends and family to the trip
        </p>
      </div>

      {/* Travelers List */}
      <div className="space-y-3 mb-6">
        <AnimatePresence mode="popLayout">
          {travelers.map((traveler) => (
            <TravelerCard
              key={traveler.id}
              name={traveler.name}
              origin={traveler.origin}
              isOrganizer={traveler.isOrganizer}
              onRemove={traveler.isOrganizer ? undefined : () => removeTraveler(traveler.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Traveler Form */}
      <AnimatePresence>
        {isAddingTraveler ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 rounded-2xl p-4 mb-6 space-y-4 overflow-hidden"
          >
            <Input
              value={newTravelerName}
              onChange={(e) => setNewTravelerName(e.target.value)}
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
                onClick={() => {
                  setIsAddingTraveler(false);
                  setNewTravelerName("");
                  setSameAirport(true);
                  setCustomOrigin(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={addTraveler}
                disabled={!newTravelerName.trim() || (!sameAirport && !customOrigin)}
                className="flex-1 rounded-xl"
              >
                Add
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsAddingTraveler(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors mb-6"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Traveler</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Trip Summary */}
      <div className="bg-muted/30 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Travelers</span>
          <span className="font-medium text-foreground">{travelers.length} people</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Destination</span>
          <span className="font-medium text-foreground">{destination.city}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="flex-1 h-12 rounded-xl text-base font-medium"
        >
          Search Flights
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
