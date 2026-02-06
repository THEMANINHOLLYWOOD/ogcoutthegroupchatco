import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCard } from "@/components/trip/TripCard";
import { fetchUserTrips } from "@/lib/tripService";
import { SavedTrip } from "@/lib/tripTypes";

const Trips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      const result = await fetchUserTrips();
      if (result.success && result.trips) {
        setTrips(result.trips);
      } else {
        setError(result.error || "Failed to load trips");
      }
      setLoading(false);
    };
    loadTrips();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">My Trips</h1>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full"
          >
            <Link to="/create-trip">
              <Plus className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && trips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Globe className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No trips yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Create your first trip and share it with friends
            </p>
            <Button asChild className="rounded-full">
              <Link to="/create-trip">
                Create a Trip
                <Plus className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* Trips List */}
        {!loading && !error && trips.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TripCard trip={trip} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Trips;
