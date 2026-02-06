import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { TripHeader } from "@/components/trip/TripHeader";
import { ItineraryView } from "@/components/trip/ItineraryView";
import { ItinerarySkeleton } from "@/components/trip/ItinerarySkeleton";
import { ShareButton } from "@/components/trip/ShareButton";
import { CostSummary } from "@/components/trip/CostSummary";
import { fetchTrip, generateItinerary, subscribeToTripUpdates } from "@/lib/tripService";
import { SavedTrip } from "@/lib/tripTypes";
import { Button } from "@/components/ui/button";

export default function TripView() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

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

  const loadTrip = useCallback(async () => {
    if (!tripId) return;

    const result = await fetchTrip(tripId);
    if (result.success && result.trip) {
      setTrip(result.trip);

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

  // Subscribe to realtime updates for itinerary
  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeToTripUpdates(tripId, (updatedTrip) => {
      setTrip(updatedTrip);
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [tripId]);

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
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Itinerary Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Your Itinerary
          </h2>

          {trip.itinerary_status === "complete" && trip.itinerary ? (
            <ItineraryView 
              itinerary={trip.itinerary}
              tripId={trip.id}
              destinationCity={trip.destination_city}
              destinationCountry={trip.destination_country}
              onItineraryUpdate={(updatedItinerary) => {
                setTrip(prev => prev ? { ...prev, itinerary: updatedItinerary } : null);
              }}
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
        </section>

        {/* Cost Summary */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
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
        </section>

        {/* Share Section */}
        <section className="sticky bottom-4 z-40">
          <div className="bg-background/95 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-lg">
            <p className="text-sm text-muted-foreground text-center mb-3">
              {trip.organizer_id ? "Share this trip with your travel group" : "Save and share this trip"}
            </p>
            <ShareButton 
              tripId={trip.id} 
              shareCode={trip.share_code} 
              isClaimed={!!trip.organizer_id}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
