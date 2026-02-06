import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/trip/CountdownTimer";
import { TravelerPaymentStatus } from "@/components/trip/TravelerPaymentStatus";
import { ConfirmationBanner } from "@/components/trip/ConfirmationBanner";
import { ShareButton } from "@/components/trip/ShareButton";
import { DashboardItineraryView } from "@/components/trip/DashboardItineraryView";
import { AddActivityModal } from "@/components/trip/AddActivityModal";
import { fetchTrip, subscribeToTripUpdates, addActivityToItinerary, removeActivityFromItinerary } from "@/lib/tripService";
import { fetchReactions, subscribeToReactions, addReaction, removeReaction, ReactionsMap, getReactionKey } from "@/lib/reactionService";
import { SavedTrip, Activity } from "@/lib/tripTypes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function TripDashboard() {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paidTravelers, setPaidTravelers] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<ReactionsMap>(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToDay, setAddingToDay] = useState<number>(1);

  const isOrganizer = trip?.organizer_id === user?.id;
  const allPaid = trip?.travelers && trip.travelers.length > 0 && 
    trip.travelers.every(t => paidTravelers.has(t.traveler_name));

  // Fetch reactions
  const loadReactions = useCallback(async () => {
    if (!tripId) return;
    const reactionsData = await fetchReactions(tripId, user?.id);
    setReactions(reactionsData);
  }, [tripId, user?.id]);

  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) return;

      const result = await fetchTrip(tripId);
      if (result.success && result.trip) {
        // Check if user is the organizer
        if (result.trip.organizer_id !== user?.id) {
          setError("You don't have access to this dashboard");
          setLoading(false);
          return;
        }
        setTrip(result.trip);
      } else {
        setError(result.error || "Trip not found");
      }
      setLoading(false);
    };

    loadTrip();
    loadReactions();
  }, [tripId, user?.id, loadReactions]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tripId) return;

    const unsubscribeTrip = subscribeToTripUpdates(tripId, (updatedTrip) => {
      setTrip(updatedTrip);
    });

    const unsubscribeReactions = subscribeToReactions(tripId, () => {
      loadReactions();
    });

    return () => {
      unsubscribeTrip.then((unsub) => unsub());
      unsubscribeReactions();
    };
  }, [tripId, loadReactions]);

  const handlePay = async (travelerName: string): Promise<void> => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPaidTravelers(prev => {
      const next = new Set(prev);
      next.add(travelerName);
      return next;
    });
  };

  const handleReact = async (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => {
    if (!tripId || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to activities",
        variant: "destructive",
      });
      return;
    }

    const key = getReactionKey(dayNumber, activityIndex);
    const currentReaction = reactions.get(key)?.user_reaction;

    if (currentReaction === reaction) {
      // Remove reaction
      const result = await removeReaction(tripId, dayNumber, activityIndex);
      if (!result.success) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } else {
      // Add/update reaction
      const result = await addReaction(tripId, dayNumber, activityIndex, reaction);
      if (!result.success) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    }
    
    // Refresh reactions
    loadReactions();
  };

  const handleRemoveActivity = async (dayNumber: number, activityIndex: number) => {
    if (!tripId) return;

    const result = await removeActivityFromItinerary(tripId, dayNumber, activityIndex);
    if (result.success) {
      toast({ title: "Activity removed" });
      // Refresh trip data
      const tripResult = await fetchTrip(tripId);
      if (tripResult.success && tripResult.trip) {
        setTrip(tripResult.trip);
      }
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleAddActivity = async (activity: Activity) => {
    if (!tripId) return;

    const result = await addActivityToItinerary(tripId, addingToDay, activity);
    if (result.success) {
      toast({ title: "Activity added" });
      // Refresh trip data
      const tripResult = await fetchTrip(tripId);
      if (tripResult.success && tripResult.trip) {
        setTrip(tripResult.trip);
      }
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      throw new Error(result.error);
    }
  };

  const openAddModal = (dayNumber: number) => {
    setAddingToDay(dayNumber);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading dashboard...
        </motion.div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          {error || "You don't have access to this dashboard."}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-lg">
          <Link to={`/trip/${tripId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              View Trip
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">Dashboard</h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Trip Info - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-foreground">
            {trip.destination_city}, {trip.destination_country}
          </h2>
          <p className="text-muted-foreground mt-1">
            {new Date(trip.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(trip.return_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </motion.div>

        {/* Confirmation or Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {allPaid ? (
            <ConfirmationBanner
              destinationCity={trip.destination_city}
              destinationCountry={trip.destination_country}
              departureDate={trip.departure_date}
              returnDate={trip.return_date}
              travelerCount={trip.travelers.length}
            />
          ) : trip.link_expires_at ? (
            <CountdownTimer expiresAt={trip.link_expires_at} />
          ) : null}
        </motion.div>

        {/* Payment Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <TravelerPaymentStatus
            travelers={trip.travelers}
            paidTravelers={paidTravelers}
            onPay={handlePay}
            isOrganizer={true}
          />
        </motion.div>

        {/* Itinerary Section */}
        {trip.itinerary && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Itinerary</h3>
            </div>
            
            <DashboardItineraryView
              itinerary={trip.itinerary}
              tripId={trip.id}
              reactions={reactions}
              isOrganizer={isOrganizer}
              allPaid={allPaid}
              canReact={!!user}
              onReact={handleReact}
              onRemoveActivity={handleRemoveActivity}
              onAddActivity={openAddModal}
            />
          </motion.section>
        )}

        {/* Cost Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Trip Total</h3>
            <span className="text-2xl font-bold text-foreground">
              ${trip.trip_total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Per person</span>
            <span>${trip.total_per_person.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <ShareButton tripId={trip.id} shareCode={trip.share_code} isClaimed={true} />
        </motion.div>
      </main>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddActivity}
        dayNumber={addingToDay}
      />
    </div>
  );
}
