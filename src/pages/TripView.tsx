import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, MapPin, Calendar, Users, Building2, Home, Plane, CreditCard } from "lucide-react";
import { TripHeader } from "@/components/trip/TripHeader";
import { ItineraryView } from "@/components/trip/ItineraryView";
import { ItinerarySkeleton } from "@/components/trip/ItinerarySkeleton";
import { CostSummary } from "@/components/trip/CostSummary";
import { CountdownTimer } from "@/components/trip/CountdownTimer";
import { TripGroupImage } from "@/components/trip/TripGroupImage";
import { TravelerPaymentStatus } from "@/components/trip/TravelerPaymentStatus";
import { TravelerPaymentDrawer } from "@/components/trip/TravelerPaymentDrawer";
import { fetchTrip, generateItinerary, subscribeToTripUpdates } from "@/lib/tripService";
import { fetchReactions, subscribeToReactions, addReaction, removeReaction, ReactionsMap, getReactionKey } from "@/lib/reactionService";
import { SavedTrip, TravelerCost, Traveler } from "@/lib/tripTypes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function TripView() {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<ReactionsMap>(new Map());
  const [paidTravelers, setPaidTravelers] = useState<Set<string>>(new Set());
  const [isPayDrawerOpen, setIsPayDrawerOpen] = useState(false);

  // Calculate trip duration
  const nights = trip ? Math.ceil(
    (new Date(trip.return_date).getTime() - new Date(trip.departure_date).getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;

  // Convert travelers to the format needed for TripGroupImage
  const travelersForImage: Traveler[] = trip?.travelers?.map((t, index) => ({
    id: `traveler-${index}`,
    name: t.traveler_name,
    origin: { iata: "", city: t.origin, country: "", name: "", lat: 0, lng: 0 },
    isOrganizer: index === 0,
    user_id: t.user_id,
    avatar_url: t.avatar_url,
  })) || [];

  // Get traveler costs for payment components
  const travelerCosts: TravelerCost[] = trip?.cost_breakdown || [];

  const toggleActivity = useCallback((dayNumber: number, activityIndex: number) => {
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

  const addAllActivities = useCallback(() => {
    if (!trip?.itinerary) return;
    const allKeys = new Set<string>();
    trip.itinerary.days.forEach(day => {
      day.activities.forEach((activity, index) => {
        if ((activity.estimated_cost || 0) > 0) {
          allKeys.add(`${day.day_number}-${index}`);
        }
      });
    });
    setSelectedActivities(allKeys);
  }, [trip?.itinerary]);

  const addDayActivities = useCallback((dayNumber: number) => {
    const day = trip?.itinerary?.days.find(d => d.day_number === dayNumber);
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
  }, [trip?.itinerary]);

  const removeDayActivities = useCallback((dayNumber: number) => {
    const day = trip?.itinerary?.days.find(d => d.day_number === dayNumber);
    if (!day) return;
    setSelectedActivities(prev => {
      const next = new Set(prev);
      day.activities.forEach((_, index) => {
        next.delete(`${dayNumber}-${index}`);
      });
      return next;
    });
  }, [trip?.itinerary]);

  // Load reactions
  const loadReactions = useCallback(async () => {
    if (!tripId) return;
    const reactionsData = await fetchReactions(tripId, user?.id);
    setReactions(reactionsData);
  }, [tripId, user?.id]);

  // Handle reaction toggle
  const handleReact = useCallback(async (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => {
    if (!tripId || !user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to react to activities", 
        variant: "destructive" 
      });
      return;
    }
    
    const key = getReactionKey(dayNumber, activityIndex);
    const currentReaction = reactions.get(key)?.user_reaction;
    
    if (currentReaction === reaction) {
      await removeReaction(tripId, dayNumber, activityIndex);
    } else {
      await addReaction(tripId, dayNumber, activityIndex, reaction);
    }
    
    loadReactions();
  }, [tripId, user, reactions, loadReactions]);

  // Handle payment for a traveler
  const handlePayForTraveler = useCallback(async (travelerName: string) => {
    if (!tripId) return;
    
    // Update local state optimistically
    const newPaidTravelers = [...paidTravelers, travelerName];
    setPaidTravelers(new Set(newPaidTravelers));
    
    // Persist to database
    const { error } = await supabase
      .from("trips")
      .update({ paid_travelers: newPaidTravelers } as never)
      .eq("id", tripId);
    
    if (error) {
      // Revert on error
      setPaidTravelers(prev => {
        const next = new Set(prev);
        next.delete(travelerName);
        return next;
      });
      toast({
        title: "Payment failed",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Payment confirmed!",
      description: `${travelerName}'s spot is secured`,
    });
  }, [tripId, paidTravelers]);

  // Handle countdown expiration
  const handleExpire = useCallback(() => {
    toast({
      title: "Time expired",
      description: "The booking window has closed.",
      variant: "destructive",
    });
  }, []);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;

    const result = await fetchTrip(tripId);
    if (result.success && result.trip) {
      setTrip(result.trip);
      // Initialize paid travelers from database
      setPaidTravelers(new Set(result.trip.paid_travelers || []));

      // Trigger itinerary generation if pending
      if (result.trip.itinerary_status === "pending") {
        generateItinerary(
          tripId,
          result.trip.destination_city,
          result.trip.destination_country,
          result.trip.departure_date,
          result.trip.return_date,
          result.trip.travelers.length,
          result.trip.accommodation?.name
        );
      }
    } else {
      setError(result.error || "Trip not found");
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  // Load reactions when trip or user changes
  useEffect(() => {
    if (tripId) {
      loadReactions();
    }
  }, [tripId, user?.id, loadReactions]);

  // Subscribe to realtime updates for itinerary and paid_travelers
  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeToTripUpdates(tripId, (updatedTrip) => {
      setTrip(updatedTrip);
      setPaidTravelers(new Set(updatedTrip.paid_travelers || []));
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [tripId]);

  // Subscribe to realtime reaction updates
  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeToReactions(tripId, () => {
      loadReactions();
    });

    return unsubscribe;
  }, [tripId, loadReactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading trip...
        </motion.div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Trip Not Found
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          {error || "This trip may have been removed or the link is invalid."}
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  // Determine accommodation type from the accommodation object
  const accommodationType = trip.accommodation?.name?.toLowerCase().includes("airbnb") ? "airbnb" : "hotel";
  const allPaid = travelerCosts.length > 0 && travelerCosts.every(t => paidTravelers.has(t.traveler_name));

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="bg-background/80 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Home
          </Button>
        </Link>
      </div>

      {/* Hero Header */}
      <TripHeader
        destinationCity={trip.destination_city}
        destinationCountry={trip.destination_country}
        departureDate={trip.departure_date}
        returnDate={trip.return_date}
        travelerCount={trip.travelers.length}
        organizerName={trip.organizer_name}
      />

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        
        {/* Countdown Timer */}
        {trip.link_expires_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <CountdownTimer 
              expiresAt={trip.link_expires_at} 
              onExpire={handleExpire}
            />
          </motion.div>
        )}

        {/* AI-Generated Group Image */}
        <TripGroupImage
          tripId={trip.id}
          destinationCity={trip.destination_city}
          destinationCountry={trip.destination_country}
          travelers={travelersForImage}
        />

        {/* Destination Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{trip.destination_city}</h2>
              <p className="text-sm text-muted-foreground">{trip.destination_country}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Calendar className="w-3 h-3" />
                Dates
              </div>
              <div className="text-sm font-medium text-foreground">
                {format(new Date(trip.departure_date), "MMM d")} – {format(new Date(trip.return_date), "MMM d")}
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
              <div className="text-sm font-medium text-foreground">{trip.travelers.length} people</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                {accommodationType === 'airbnb' ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                {accommodationType === 'airbnb' ? 'Airbnb' : 'Hotel'}
              </div>
              <div className="text-sm font-medium text-foreground truncate">
                {trip.accommodation?.name || 'TBD'}
              </div>
            </div>
          </div>

          {/* Flight Times */}
          {trip.flights && trip.flights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Plane className="w-3 h-3" />
                Flights
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Depart: </span>
                  <span className="font-medium text-foreground">{trip.flights[0].departure_time}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Arrive: </span>
                  <span className="font-medium text-foreground">{trip.flights[0].arrival_time}</span>
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
            onPay={handlePayForTraveler}
            isOrganizer={false}
          />
        </motion.div>

        {/* Itinerary Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground">Your Itinerary</h2>

          {trip.itinerary_status === "complete" && trip.itinerary ? (
            <ItineraryView 
              itinerary={trip.itinerary}
              tripId={trip.id}
              destinationCity={trip.destination_city}
              destinationCountry={trip.destination_country}
              onItineraryUpdate={(updatedItinerary) => {
                setTrip(prev => prev ? { ...prev, itinerary: updatedItinerary } : null);
              }}
              reactions={reactions}
              onReact={handleReact}
              canReact={!!user}
            />
          ) : trip.itinerary_status === "failed" ? (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">
                Failed to generate itinerary
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try refreshing the page
              </p>
            </div>
          ) : (
            <ItinerarySkeleton />
          )}
        </motion.div>

        {/* Cost Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Cost Breakdown
          </h2>
          <CostSummary
            breakdown={trip.cost_breakdown}
            accommodation={trip.accommodation}
            totalPerPerson={trip.total_per_person}
            tripTotal={trip.trip_total}
            itinerary={trip.itinerary}
            travelerCount={trip.travelers.length}
            selectedActivities={selectedActivities}
            onToggleActivity={toggleActivity}
            onAddAllActivities={addAllActivities}
            onAddDayActivities={addDayActivities}
            onRemoveDayActivities={removeDayActivities}
          />
        </motion.div>

        {/* Pay Button - Sticky at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky bottom-4 z-40"
        >
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-lg">
            {allPaid ? (
              <div className="text-center">
                <p className="text-primary font-medium mb-2">✨ All travelers have paid!</p>
                <p className="text-sm text-muted-foreground">
                  You're going to {trip.destination_city}!
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Secure your spot on this trip
                </p>
                <Button
                  onClick={() => setIsPayDrawerOpen(true)}
                  className="w-full h-12 rounded-xl text-base font-medium"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Prices are estimates and may vary. Final prices confirmed at booking.
        </p>
      </main>

      {/* Payment Drawer */}
      <TravelerPaymentDrawer
        travelers={travelerCosts}
        paidTravelers={paidTravelers}
        onPay={handlePayForTraveler}
        open={isPayDrawerOpen}
        onOpenChange={setIsPayDrawerOpen}
      />
    </div>
  );
}
