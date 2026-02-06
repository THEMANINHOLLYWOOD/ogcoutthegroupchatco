import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/trip/CountdownTimer";
import { TravelerPaymentStatus } from "@/components/trip/TravelerPaymentStatus";
import { ConfirmationBanner } from "@/components/trip/ConfirmationBanner";
import { ShareButton } from "@/components/trip/ShareButton";
import { fetchTrip, subscribeToTripUpdates } from "@/lib/tripService";
import { SavedTrip } from "@/lib/tripTypes";
import { useAuth } from "@/hooks/useAuth";

export default function TripDashboard() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paidTravelers, setPaidTravelers] = useState<Set<string>>(new Set());

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
  }, [tripId, user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = subscribeToTripUpdates(tripId, (updatedTrip) => {
      setTrip(updatedTrip);
    });

    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, [tripId]);

  const togglePaid = (travelerName: string) => {
    setPaidTravelers(prev => {
      const next = new Set(prev);
      if (next.has(travelerName)) {
        next.delete(travelerName);
      } else {
        next.add(travelerName);
      }
      return next;
    });
  };

  const allPaid = trip?.travelers && trip.travelers.length > 0 && 
    trip.travelers.every(t => paidTravelers.has(t.traveler_name));

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
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-3xl">
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

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {/* Trip Info */}
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
          className="bg-card border border-border rounded-2xl p-6"
        >
          <TravelerPaymentStatus
            travelers={trip.travelers}
            paidTravelers={paidTravelers}
            onTogglePaid={togglePaid}
            isOrganizer={true}
          />
        </motion.div>

        {/* Cost Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
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
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Share with Friends</h3>
          </div>
          <ShareButton tripId={trip.id} shareCode={trip.share_code} isClaimed={true} />
        </motion.div>
      </main>
    </div>
  );
}
