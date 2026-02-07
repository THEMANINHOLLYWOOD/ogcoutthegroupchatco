import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, Users, Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TravelerCard } from "./TravelerCard";
import { UserSearchPicker } from "./UserSearchPicker";
import { ManualTravelerForm } from "./ManualTravelerForm";
import { PlatformUserConfirm } from "./PlatformUserConfirm";
import { Airport } from "@/lib/airportSearch";
import { Traveler, AccommodationType } from "@/lib/tripTypes";
import { PlatformUser } from "@/lib/userService";
import { cn } from "@/lib/utils";

interface AddTravelersStepProps {
  organizerName: string;
  organizerId?: string;
  organizerAvatarUrl?: string;
  defaultOrigin: Airport;
  destination: Airport;
  onContinue: (travelers: Traveler[], accommodationType: AccommodationType) => void;
  onBack: () => void;
}

export function AddTravelersStep({
  organizerName,
  organizerId,
  organizerAvatarUrl,
  defaultOrigin,
  destination,
  onContinue,
  onBack,
}: AddTravelersStepProps) {
  const [travelers, setTravelers] = useState<Traveler[]>([
    {
      id: "organizer",
      name: organizerName || "You",
      origin: defaultOrigin,
      isOrganizer: true,
      user_id: organizerId,
      avatar_url: organizerAvatarUrl,
    },
  ]);
  
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [pendingUser, setPendingUser] = useState<PlatformUser | null>(null);
  const [accommodationType, setAccommodationType] = useState<AccommodationType>("hotel");

  const addPlatformUser = useCallback((user: PlatformUser, origin: Airport) => {
    const newTraveler: Traveler = {
      id: crypto.randomUUID(),
      name: user.full_name || "Unknown User",
      origin,
      isOrganizer: false,
      user_id: user.id,
      avatar_url: user.avatar_url || undefined,
    };

    setTravelers((prev) => [...prev, newTraveler]);
    setPendingUser(null);
  }, []);

  const addManualTraveler = useCallback((name: string, origin: Airport) => {
    const newTraveler: Traveler = {
      id: crypto.randomUUID(),
      name,
      origin,
      isOrganizer: false,
    };

    setTravelers((prev) => [...prev, newTraveler]);
    setShowManualForm(false);
  }, []);

  const removeTraveler = useCallback((id: string) => {
    setTravelers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleContinue = () => {
    onContinue(travelers, accommodationType);
  };

  const excludeUserIds = travelers
    .filter(t => t.user_id)
    .map(t => t.user_id!);

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
              avatarUrl={traveler.avatar_url}
              userId={traveler.user_id}
              onRemove={traveler.isOrganizer ? undefined : () => removeTraveler(traveler.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {showManualForm && (
          <ManualTravelerForm
            defaultOrigin={defaultOrigin}
            onAdd={addManualTraveler}
            onCancel={() => setShowManualForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Add Traveler Button */}
      {!showManualForm && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowUserSearch(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors mb-6"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Traveler</span>
        </motion.button>
      )}

      {/* Accommodation Type Selector */}
      <div className="space-y-3 mb-6">
        <p className="text-sm text-muted-foreground text-center">Where to stay</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccommodationType("airbnb")}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all text-center",
              accommodationType === "airbnb"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Home className="w-6 h-6 mx-auto mb-2 text-foreground" />
            <span className="text-sm font-medium text-foreground">Airbnb</span>
          </button>
          <button
            type="button"
            onClick={() => setAccommodationType("hotel")}
            className={cn(
              "p-4 rounded-2xl border-2 transition-all text-center",
              accommodationType === "hotel"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Building2 className="w-6 h-6 mx-auto mb-2 text-foreground" />
            <span className="text-sm font-medium text-foreground">Hotel</span>
          </button>
        </div>
      </div>

      {/* User Search Picker */}
      <UserSearchPicker
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onSelectUser={(user) => {
          setShowUserSearch(false);
          setPendingUser(user);
        }}
        onManualEntry={() => {
          setShowUserSearch(false);
          setShowManualForm(true);
        }}
        excludeUserIds={excludeUserIds}
      />

      {/* Platform User Confirmation */}
      <PlatformUserConfirm
        user={pendingUser}
        defaultOrigin={defaultOrigin}
        open={pendingUser !== null}
        onConfirm={addPlatformUser}
        onCancel={() => setPendingUser(null)}
      />

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
          Create a Trip
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
