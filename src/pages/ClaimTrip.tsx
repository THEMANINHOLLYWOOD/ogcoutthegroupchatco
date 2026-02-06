import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { claimTrip } from "@/lib/tripService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function ClaimTrip() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleClaim = async () => {
      if (authLoading) return;
      
      if (!user) {
        // Redirect to auth with return URL
        navigate(`/auth?redirect=/trip/${tripId}/claim`);
        return;
      }

      if (!tripId) {
        setError("Invalid trip");
        return;
      }

      setClaiming(true);
      const result = await claimTrip(tripId);

      if (result.success) {
        toast({
          title: "Trip claimed!",
          description: "You can now manage this trip from your dashboard.",
        });
        navigate(`/trip/${tripId}/dashboard`);
      } else {
        setError(result.error || "Failed to claim trip");
        setClaiming(false);
      }
    };

    handleClaim();
  }, [tripId, user, authLoading, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => navigate(`/trip/${tripId}`)}
          className="text-primary hover:underline"
        >
          Return to trip
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground">
          {authLoading ? "Checking authentication..." : "Claiming your trip..."}
        </p>
      </motion.div>
    </div>
  );
}
