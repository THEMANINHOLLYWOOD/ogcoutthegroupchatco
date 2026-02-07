import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TripCard } from "@/components/trip/TripCard";
import { fetchUserTrips } from "@/lib/tripService";
import { SavedTrip } from "@/lib/tripTypes";

export function ProfileTrips() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      const result = await fetchUserTrips();
      if (result.success && result.trips) {
        setTrips(result.trips);
      }
      setLoading(false);
    }
    loadTrips();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Plane className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No trips yet
        </h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          Create your first trip to start planning your adventure
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/create-trip">
            <Plus className="w-4 h-4 mr-2" />
            Create Trip
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          {trips.length} {trips.length === 1 ? "Trip" : "Trips"}
        </h3>
        <Button variant="outline" size="sm" asChild className="rounded-xl">
          <Link to="/create-trip">
            <Plus className="w-4 h-4 mr-1" />
            New Trip
          </Link>
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TripCard trip={trip} />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
