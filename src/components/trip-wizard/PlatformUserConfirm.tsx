import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { Airport } from "@/lib/airportSearch";
import { PlatformUser } from "@/lib/userService";

interface PlatformUserConfirmProps {
  user: PlatformUser | null;
  defaultOrigin: Airport;
  open: boolean;
  onConfirm: (user: PlatformUser, origin: Airport) => void;
  onCancel: () => void;
}

export function PlatformUserConfirm({
  user,
  defaultOrigin,
  open,
  onConfirm,
  onCancel,
}: PlatformUserConfirmProps) {
  const [sameAirport, setSameAirport] = useState(true);
  const [customOrigin, setCustomOrigin] = useState<Airport | null>(null);

  const handleConfirm = () => {
    if (!user) return;
    const origin = sameAirport ? defaultOrigin : customOrigin;
    if (!origin) return;
    onConfirm(user, origin);
    // Reset state for next use
    setSameAirport(true);
    setCustomOrigin(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
      setSameAirport(true);
      setCustomOrigin(null);
    }
  };

  const canConfirm = sameAirport || customOrigin;

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Add {user.full_name?.split(" ")[0] || "Traveler"}</SheetTitle>
        </SheetHeader>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.full_name || "User"} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg text-foreground">
              {user.full_name || "Unknown User"}
            </p>
            {user.home_city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>
                  {user.home_city}
                  {user.home_country ? `, ${user.home_country}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
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
          <AnimatePresence>
            {!sameAirport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <AirportAutocomplete
                  value={customOrigin}
                  onChange={setCustomOrigin}
                  placeholder="Where are they flying from?"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="w-full h-12 rounded-xl mt-6"
        >
          Add to Trip
        </Button>
      </SheetContent>
    </Sheet>
  );
}
