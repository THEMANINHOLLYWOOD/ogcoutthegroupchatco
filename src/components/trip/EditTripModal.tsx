import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AirportAutocomplete } from "@/components/trip-wizard/AirportAutocomplete";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Airport } from "@/lib/airportSearch";
import { TripResult, Traveler, AccommodationType } from "@/lib/tripTypes";
import { searchTrip } from "@/lib/tripSearch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/tripService";
import { EditableTravelerCard } from "./EditableTravelerCard";
import { UserSearchPicker } from "@/components/trip-wizard/UserSearchPicker";
import { ManualTravelerForm } from "@/components/trip-wizard/ManualTravelerForm";
import { PlatformUserConfirm } from "@/components/trip-wizard/PlatformUserConfirm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlatformUser } from "@/lib/userService";

interface EditTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDestination: Airport;
  currentOrigin: Airport;
  currentDepartureDate: Date;
  currentReturnDate: Date;
  travelers: Traveler[];
  tripId: string;
  accommodationType?: AccommodationType;
  onUpdateComplete: (newData: {
    tripResult: TripResult;
    destination: Airport;
    origin: Airport;
    departureDate: Date;
    returnDate: Date;
    expiresAt: string;
    travelers: Traveler[];
  }) => void;
}

export function EditTripModal({
  open,
  onOpenChange,
  currentDestination,
  currentOrigin,
  currentDepartureDate,
  currentReturnDate,
  travelers,
  tripId,
  accommodationType = "hotel",
  onUpdateComplete,
}: EditTripModalProps) {
  const [destination, setDestination] = useState<Airport>(currentDestination);
  const [origin, setOrigin] = useState<Airport>(currentOrigin);
  const [departureDate, setDepartureDate] = useState<Date>(currentDepartureDate);
  const [returnDate, setReturnDate] = useState<Date>(currentReturnDate);
  const [localTravelers, setLocalTravelers] = useState<Traveler[]>(travelers);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add traveler state
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showUserConfirm, setShowUserConfirm] = useState(false);
  const [pendingUser, setPendingUser] = useState<PlatformUser | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setDestination(currentDestination);
      setOrigin(currentOrigin);
      setDepartureDate(currentDepartureDate);
      setReturnDate(currentReturnDate);
      setLocalTravelers(travelers);
      setShowUserSearch(false);
      setShowManualForm(false);
      setShowUserConfirm(false);
      setPendingUser(null);
    }
  }, [open, currentDestination, currentOrigin, currentDepartureDate, currentReturnDate, travelers]);

  const handleSelectUser = useCallback((user: PlatformUser) => {
    setPendingUser(user);
    setShowUserSearch(false);
    setShowUserConfirm(true);
  }, []);

  const handleConfirmPlatformUser = useCallback((user: PlatformUser, userOrigin: Airport) => {
    const newTraveler: Traveler = {
      id: crypto.randomUUID(),
      name: user.full_name || "Unknown User",
      origin: userOrigin,
      isOrganizer: false,
      user_id: user.id,
      avatar_url: user.avatar_url || undefined,
    };
    
    setLocalTravelers(prev => [...prev, newTraveler]);
    setPendingUser(null);
    setShowUserConfirm(false);
  }, []);

  const handleAddManualTraveler = useCallback((name: string, travelerOrigin: Airport) => {
    const newTraveler: Traveler = {
      id: crypto.randomUUID(),
      name,
      origin: travelerOrigin,
      isOrganizer: false,
    };
    
    setLocalTravelers(prev => [...prev, newTraveler]);
    setShowManualForm(false);
  }, []);

  const handleRemoveTraveler = useCallback((id: string) => {
    setLocalTravelers(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleUpdate = useCallback(async () => {
    if (localTravelers.length === 0) {
      toast({
        title: "No travelers",
        description: "Please add at least one traveler.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Re-search with new parameters
      const searchResult = await searchTrip({
        organizer: {
          first_name: localTravelers[0]?.name.split(" ")[0] || "Traveler",
          last_name: localTravelers[0]?.name.split(" ").slice(1).join(" ") || "",
          document_type: "passport",
          confidence: "high",
        },
        destination,
        origin,
        travelers: localTravelers.map(t => ({
          ...t,
          origin: t.isOrganizer ? origin : t.origin,
        })),
        departureDate,
        returnDate,
        accommodationType,
      });

      if (!searchResult.success || !searchResult.data) {
        toast({
          title: "Update failed",
          description: searchResult.error || "Could not find trip options",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      // Calculate new 24-hour expiration
      const newExpiration = new Date();
      newExpiration.setHours(newExpiration.getHours() + 24);

      // Update trip in database
      const { error: updateError } = await supabase
        .from("trips")
        .update({
          destination_city: destination.city,
          destination_country: destination.country,
          destination_iata: destination.iata,
          departure_date: format(departureDate, "yyyy-MM-dd"),
          return_date: format(returnDate, "yyyy-MM-dd"),
          flights: searchResult.data.flights as never,
          accommodation: searchResult.data.accommodation as never,
          cost_breakdown: searchResult.data.breakdown as never,
          total_per_person: searchResult.data.total_per_person,
          trip_total: searchResult.data.trip_total,
          link_expires_at: newExpiration.toISOString(),
          itinerary_status: "pending",
          itinerary: null,
          travelers: localTravelers.map(t => ({
            traveler_name: t.name,
            origin: t.origin.iata,
            destination: destination.iata,
            flight_cost: 0,
            accommodation_share: 0,
            subtotal: 0,
            user_id: t.user_id,
            avatar_url: t.avatar_url,
          })) as never,
        } as never)
        .eq("id", tripId);

      if (updateError) {
        toast({
          title: "Update failed",
          description: updateError.message,
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      // Regenerate itinerary for new destination/dates
      generateItinerary(
        tripId,
        destination.city,
        destination.country,
        format(departureDate, "yyyy-MM-dd"),
        format(returnDate, "yyyy-MM-dd"),
        localTravelers.length,
        searchResult.data.accommodation?.name
      );

      // Regenerate group image for new destination
      supabase.functions.invoke("generate-share-image", {
        body: {
          tripId,
          destinationCity: destination.city,
          destinationCountry: destination.country,
          travelers: localTravelers.map(t => ({
            name: t.name,
            avatar_url: t.avatar_url || null,
          })),
          type: "group",
          regenerate: true,
        },
      }).catch(err => {
        console.error("Error regenerating group image:", err);
      });

      toast({
        title: "Trip updated!",
        description: "Your prices have been refreshed and timer reset.",
      });

      onUpdateComplete({
        tripResult: searchResult.data,
        destination,
        origin,
        departureDate,
        returnDate,
        expiresAt: newExpiration.toISOString(),
        travelers: localTravelers,
      });

      onOpenChange(false);
    } catch (err) {
      console.error("Error updating trip:", err);
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    destination,
    origin,
    departureDate,
    returnDate,
    localTravelers,
    tripId,
    accommodationType,
    onUpdateComplete,
    onOpenChange,
  ]);

  // Get existing user IDs to exclude from search
  const existingUserIds = localTravelers
    .filter(t => t.user_id)
    .map(t => t.user_id!);

  const handleManualEntry = useCallback(() => {
    setShowUserSearch(false);
    setShowManualForm(true);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Trip Details</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 py-4"
            >
              {/* Destination */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Destination
                </label>
                <AirportAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="Where to?"
                />
              </div>

              {/* Origin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Departing From
                </label>
                <AirportAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  placeholder="Your city"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Departure
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !departureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {departureDate ? format(departureDate, "MMM d") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={(date) => date && setDepartureDate(date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Return
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "MMM d") : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => date && setReturnDate(date)}
                        disabled={(date) => date <= departureDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Travelers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Travelers ({localTravelers.length})
                  </label>
                </div>

                {/* Traveler Cards */}
                <AnimatePresence mode="popLayout">
                  {localTravelers.map((traveler) => (
                    <EditableTravelerCard
                      key={traveler.id}
                      traveler={traveler}
                      onRemove={traveler.isOrganizer ? undefined : () => handleRemoveTraveler(traveler.id)}
                      isCompact
                    />
                  ))}
                </AnimatePresence>

                {/* Add Traveler Section */}
                {!showManualForm ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUserSearch(true)}
                      className="flex-1"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Find User
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualForm(true)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manually
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ManualTravelerForm
                      defaultOrigin={origin}
                      onAdd={handleAddManualTraveler}
                      onCancel={() => setShowManualForm(false)}
                    />
                  </motion.div>
                )}
              </div>

              {/* Update Button */}
              <Button
                onClick={handleUpdate}
                disabled={isUpdating || localTravelers.length === 0}
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Trip"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Updating will refresh prices and reset the 24-hour timer
              </p>
            </motion.div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* User Search Sheet */}
      <UserSearchPicker
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onSelectUser={handleSelectUser}
        onManualEntry={handleManualEntry}
        excludeUserIds={existingUserIds}
      />

      {/* Platform User Confirm Sheet */}
      <PlatformUserConfirm
        user={pendingUser}
        defaultOrigin={origin}
        open={showUserConfirm}
        onConfirm={handleConfirmPlatformUser}
        onCancel={() => {
          setPendingUser(null);
          setShowUserConfirm(false);
        }}
      />
    </>
  );
}
