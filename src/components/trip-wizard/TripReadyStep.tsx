import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, Check, ChevronDown, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TripResult, Traveler, Itinerary } from "@/lib/tripTypes";
import { Airport } from "@/lib/airportSearch";
import { CostBreakdown } from "./CostBreakdown";
import { ItineraryView } from "@/components/trip/ItineraryView";
import { ItinerarySkeleton } from "@/components/trip/ItinerarySkeleton";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TripReadyStepProps {
  tripId: string;
  tripResult: TripResult;
  destination: Airport;
  departureDate: Date;
  returnDate: Date;
  travelers: Traveler[];
  itinerary: Itinerary | null;
  itineraryStatus: 'pending' | 'generating' | 'complete' | 'failed';
  shareCode: string;
  onEdit: () => void;
}

export function TripReadyStep({
  tripResult,
  destination,
  departureDate,
  returnDate,
  travelers,
  itinerary,
  itineraryStatus,
  shareCode,
  onEdit,
}: TripReadyStepProps) {
  const [isCostOpen, setIsCostOpen] = useState(false);
  const nights = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleCopyLink = async () => {
    const shareUrl = `https://outthegroupchatco.com/trip/${shareCode}`;
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
  };

  const handleShare = async () => {
    const shareUrl = `https://outthegroupchatco.com/trip/${shareCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${destination.city}`,
          text: `Join our trip to ${destination.city}!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed, fall back to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      {/* Success Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
        >
          <Check className="w-8 h-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Your trip is ready!
        </h1>
        <p className="text-muted-foreground text-sm">
          Share with your group and start planning together
        </p>
      </div>

      {/* Destination Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/10"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{destination.city}</h2>
            <p className="text-sm text-muted-foreground">{destination.country}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
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
        </div>
      </motion.div>

      {/* Cost Summary - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-background border border-border rounded-2xl overflow-hidden"
      >
        <Collapsible open={isCostOpen} onOpenChange={setIsCostOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="text-left">
                <div className="text-sm text-muted-foreground">Trip Total</div>
                <div className="text-2xl font-bold text-foreground">
                  ${tripResult.trip_total.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  ~${tripResult.total_per_person.toLocaleString()}/person
                </div>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isCostOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border px-4">
              {tripResult.breakdown.map((item, index) => (
                <CostBreakdown
                  key={index}
                  breakdown={item}
                  isLast={index === tripResult.breakdown.length - 1}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </motion.div>

      {/* Itinerary Section */}
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
          <ItineraryView itinerary={itinerary} />
        )}
        
        {itineraryStatus === 'failed' && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive">
              Couldn't generate itinerary. You can still share your trip!
            </p>
          </div>
        )}
      </motion.div>

      {/* Share Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 pt-4"
      >
        <Button
          onClick={handleShare}
          className="w-full h-12 rounded-xl text-base font-medium"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Trip
        </Button>
        
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy link
        </button>
        
        <button
          onClick={onEdit}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit trip details
        </button>
      </motion.div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground text-center">
        Prices are estimates and may vary. Final prices confirmed at booking.
      </p>
    </motion.div>
  );
}
