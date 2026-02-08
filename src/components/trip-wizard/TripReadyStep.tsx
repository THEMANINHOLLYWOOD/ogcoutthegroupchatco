import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, Share2, Pencil, Building2, Home, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripResult, Traveler, Itinerary, TravelerCost, AccommodationType } from "@/lib/tripTypes";
import { Airport } from "@/lib/airportSearch";
import { CountdownTimer } from "@/components/trip/CountdownTimer";
import { TripGroupImage } from "@/components/trip/TripGroupImage";
import { EditTripModal } from "@/components/trip/EditTripModal";
import { TravelerPaymentStatus } from "@/components/trip/TravelerPaymentStatus";
import { CostSummary } from "@/components/trip/CostSummary";
import { ItineraryView } from "@/components/trip/ItineraryView";
import { ItinerarySkeleton } from "@/components/trip/ItinerarySkeleton";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { fetchReactions, subscribeToReactions, addReaction, removeReaction, ReactionsMap, getReactionKey } from "@/lib/reactionService";
import { useAuth } from "@/hooks/useAuth";

interface TripReadyStepProps {
  tripId: string;
  tripResult: TripResult;
  destination: Airport;
  origin: Airport | null;
  departureDate: Date;
  returnDate: Date;
  travelers: Traveler[];
  itinerary: Itinerary | null;
  itineraryStatus: 'pending' | 'generating' | 'complete' | 'failed';
  shareCode: string;
  expiresAt: string;
  accommodationType?: AccommodationType;
  onTripUpdate?: (newData: {
    tripResult: TripResult;
    destination: Airport;
    origin: Airport;
    departureDate: Date;
    returnDate: Date;
    expiresAt: string;
    travelers: Traveler[];
  }) => void;
}

export function TripReadyStep({
  tripId,
  tripResult: initialTripResult,
  destination: initialDestination,
  origin: initialOrigin,
  departureDate: initialDepartureDate,
  returnDate: initialReturnDate,
  travelers: initialTravelers,
  itinerary,
  itineraryStatus,
  shareCode,
  expiresAt: initialExpiresAt,
  accommodationType = "hotel",
  onTripUpdate,
}: TripReadyStepProps) {
  const [tripResult, setTripResult] = useState(initialTripResult);
  const [destination, setDestination] = useState(initialDestination);
  const [origin, setOrigin] = useState(initialOrigin);
  const [departureDate, setDepartureDate] = useState(initialDepartureDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [travelers, setTravelers] = useState(initialTravelers);
  
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [paidTravelers, setPaidTravelers] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupImageKey, setGroupImageKey] = useState(0);
  const [reactions, setReactions] = useState<ReactionsMap>(new Map());
  
  const { user } = useAuth();
  
  const nights = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));

  // Convert travelers to TravelerCost format for payment status
  const travelerCosts: TravelerCost[] = tripResult.breakdown.map((item, index) => ({
    ...item,
    user_id: travelers[index]?.user_id,
    avatar_url: travelers[index]?.avatar_url,
  }));

  // Load reactions
  const loadReactions = useCallback(async () => {
    if (!tripId) return;
    const reactionsData = await fetchReactions(tripId, user?.id);
    setReactions(reactionsData);
  }, [tripId, user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    loadReactions();
    const unsubscribe = subscribeToReactions(tripId, loadReactions);
    return unsubscribe;
  }, [tripId, loadReactions]);

  // Handle reaction
  const handleReact = useCallback(async (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to react", variant: "destructive" });
      return;
    }
    const key = getReactionKey(dayNumber, activityIndex);
    const current = reactions.get(key)?.user_reaction;
    
    if (current === reaction) {
      await removeReaction(tripId, dayNumber, activityIndex);
    } else {
      await addReaction(tripId, dayNumber, activityIndex, reaction);
    }
    loadReactions();
  }, [tripId, user, reactions, loadReactions]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/trip/${tripId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${destination.city}`,
          text: `Join our trip to ${destination.city}! Use code: ${shareCode}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed, fall back to copy
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied!",
            description: "Share it with your group",
          });
        } catch {
          toast({
            title: "Couldn't copy",
            description: shareUrl,
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share it with your group",
        });
      } catch {
        toast({
          title: "Couldn't copy",
          description: shareUrl,
          variant: "destructive",
        });
      }
    }
  };

  const handlePayTraveler = useCallback(async (travelerName: string) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPaidTravelers(prev => new Set([...prev, travelerName]));
    toast({
      title: "Payment recorded",
      description: `${travelerName} has been marked as paid`,
    });
  }, []);

  const handleToggleActivity = useCallback((dayNumber: number, activityIndex: number) => {
    const key = `${dayNumber}-${activityIndex}`;
    setSelectedActivities(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleAddAllActivities = useCallback(() => {
    if (!itinerary) return;
    const allKeys = new Set<string>();
    itinerary.days.forEach(day => {
      day.activities.forEach((activity, index) => {
        if ((activity.estimated_cost || 0) > 0) {
          allKeys.add(`${day.day_number}-${index}`);
        }
      });
    });
    
    // Toggle: if all are selected, deselect all; otherwise select all
    const allSelected = itinerary.days.every(day =>
      day.activities.every((activity, index) => {
        if ((activity.estimated_cost || 0) === 0) return true;
        return selectedActivities.has(`${day.day_number}-${index}`);
      })
    );
    
    setSelectedActivities(allSelected ? new Set() : allKeys);
  }, [itinerary, selectedActivities]);

  const handleAddDayActivities = useCallback((dayNumber: number) => {
    if (!itinerary) return;
    const day = itinerary.days.find(d => d.day_number === dayNumber);
    if (!day) return;
    
    setSelectedActivities(prev => {
      const next = new Set(prev);
      day.activities.forEach((activity, index) => {
        if ((activity.estimated_cost || 0) > 0) {
          next.add(`${dayNumber}-${index}`);
        }
      });
      return next;
    });
  }, [itinerary]);

  const handleRemoveDayActivities = useCallback((dayNumber: number) => {
    if (!itinerary) return;
    const day = itinerary.days.find(d => d.day_number === dayNumber);
    if (!day) return;
    
    setSelectedActivities(prev => {
      const next = new Set(prev);
      day.activities.forEach((_, index) => {
        next.delete(`${dayNumber}-${index}`);
      });
      return next;
    });
  }, [itinerary]);

  const handleExpire = useCallback(() => {
    toast({
      title: "Time expired",
      description: "Edit trip to refresh prices.",
      variant: "destructive",
    });
  }, []);

  const handleTripUpdate = useCallback((newData: {
    tripResult: TripResult;
    destination: Airport;
    origin: Airport;
    departureDate: Date;
    returnDate: Date;
    expiresAt: string;
    travelers: Traveler[];
  }) => {
    setTripResult(newData.tripResult);
    setDestination(newData.destination);
    setOrigin(newData.origin);
    setDepartureDate(newData.departureDate);
    setReturnDate(newData.returnDate);
    setExpiresAt(newData.expiresAt);
    setTravelers(newData.travelers);
    // Force re-render of group image
    setGroupImageKey(prev => prev + 1);
    onTripUpdate?.(newData);
  }, [onTripUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      {/* Countdown Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <CountdownTimer 
          expiresAt={expiresAt} 
          onExpire={handleExpire}
        />
      </motion.div>

      {/* AI-Generated Group Image */}
      <TripGroupImage
        key={groupImageKey}
        tripId={tripId}
        destinationCity={destination.city}
        destinationCountry={destination.country}
        travelers={travelers}
      />

      {/* Destination Card with Edit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/10"
      >
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10"
          title="Edit trip details"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{destination.city}</h2>
            <p className="text-sm text-muted-foreground">{destination.country}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              Dates
            </div>
            <div className="text-sm font-medium text-foreground">
              {format(departureDate, "MMM d")} – {format(returnDate, "MMM d")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Stay</div>
            <div className="text-sm font-medium text-foreground">{nights} nights</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Group
            </div>
            <div className="text-sm font-medium text-foreground">{travelers.length} people</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {accommodationType === 'airbnb' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {accommodationType === 'airbnb' ? 'Airbnb' : 'Hotel'}
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {tripResult.accommodation?.name || 'TBD'}
            </div>
          </div>
        </div>

        {/* Flight Times */}
        {tripResult.flights.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Plane className="w-3 h-3" />
              Flights
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Depart: </span>
                <span className="font-medium text-foreground">{tripResult.flights[0].departure_time}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Arrive: </span>
                <span className="font-medium text-foreground">{tripResult.flights[0].arrival_time}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Traveler Payment Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-background border border-border rounded-2xl p-4"
      >
        <TravelerPaymentStatus
          travelers={travelerCosts}
          paidTravelers={paidTravelers}
          onPay={handlePayTraveler}
          isOrganizer={true}
        />
      </motion.div>

      {/* Itinerary Section - Now before Cost Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-semibold text-foreground">Your Itinerary</h2>
        
        {(itineraryStatus === 'pending' || itineraryStatus === 'generating') && (
          <ItinerarySkeleton />
        )}
        
        {itineraryStatus === 'complete' && itinerary && (
          <ItineraryView 
            itinerary={itinerary}
            reactions={reactions}
            onReact={handleReact}
            canReact={!!user}
          />
        )}
        
        {itineraryStatus === 'failed' && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive">
              Couldn't generate itinerary. You can still share your trip!
            </p>
          </div>
        )}
      </motion.div>

      {/* Cost Summary with Activity Selection - Now after Itinerary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <CostSummary
          breakdown={tripResult.breakdown}
          accommodation={tripResult.accommodation}
          totalPerPerson={tripResult.total_per_person}
          tripTotal={tripResult.trip_total}
          itinerary={itinerary}
          travelerCount={travelers.length}
          selectedActivities={selectedActivities}
          onToggleActivity={handleToggleActivity}
          onAddAllActivities={handleAddAllActivities}
          onAddDayActivities={handleAddDayActivities}
          onRemoveDayActivities={handleRemoveDayActivities}
        />
      </motion.div>

      {/* Share Button Only */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <Button
          onClick={handleShare}
          className="w-full h-12 rounded-xl text-base font-medium"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Trip
        </Button>
      </motion.div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center">
        Prices are estimates and may vary. Final prices confirmed at booking.
      </p>

      {/* Edit Trip Modal */}
      {origin && (
        <EditTripModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          currentDestination={destination}
          currentOrigin={origin}
          currentDepartureDate={departureDate}
          currentReturnDate={returnDate}
          travelers={travelers}
          tripId={tripId}
          accommodationType={accommodationType}
          onUpdateComplete={handleTripUpdate}
        />
      )}
    </motion.div>
  );
}
