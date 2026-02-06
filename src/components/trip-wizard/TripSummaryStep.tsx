import { motion } from "framer-motion";
import { MapPin, Calendar, Hotel, Users, Share2, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripResult, Traveler } from "@/lib/tripTypes";
import { Airport } from "@/lib/airportSearch";
import { CostBreakdown } from "./CostBreakdown";
import { format } from "date-fns";

interface TripSummaryStepProps {
  result: TripResult;
  destination: Airport;
  departureDate: Date;
  returnDate: Date;
  travelers: Traveler[];
  onEdit: () => void;
  onShare: () => void;
}

export function TripSummaryStep({
  result,
  destination,
  departureDate,
  returnDate,
  travelers,
  onEdit,
  onShare,
}: TripSummaryStepProps) {
  const nights = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      {/* Success Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4"
        >
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your trip is ready!
        </h1>
        <p className="text-muted-foreground">
          Here's the breakdown for everyone
        </p>
      </div>

      {/* Receipt Card */}
      <div className="bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Destination Header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{destination.city}</h2>
              <p className="text-sm text-muted-foreground">{destination.country}</p>
            </div>
          </div>

          {/* Trip Details */}
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
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Hotel className="w-3 h-3" />
                Stay
              </div>
              <div className="text-sm font-medium text-foreground">
                {nights} nights
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" />
                Group
              </div>
              <div className="text-sm font-medium text-foreground">
                {travelers.length} people
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation Info */}
        {result.accommodation && (
          <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Accommodation</div>
                <div className="font-medium text-foreground">{result.accommodation.name}</div>
                <div className="text-xs text-muted-foreground">
                  ${result.accommodation.price_per_night}/night · {result.accommodation.rating}★
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  ${result.accommodation.total_price.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">total</div>
              </div>
            </div>
          </div>
        )}

        {/* Per-Person Breakdown */}
        <div className="px-6">
          {result.breakdown.map((item, index) => (
            <CostBreakdown
              key={index}
              breakdown={item}
              isLast={index === result.breakdown.length - 1}
            />
          ))}
        </div>

        {/* Total */}
        <div className="px-6 py-4 bg-primary/5 border-t border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Per person average</span>
            <span className="font-semibold text-foreground">
              ${result.total_per_person.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">Trip Total</span>
            <span className="text-2xl font-bold text-primary">
              ${result.trip_total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onEdit}
          className="flex-1 h-12 rounded-xl"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Trip
        </Button>
        <Button
          onClick={onShare}
          className="flex-1 h-12 rounded-xl text-base font-medium"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Trip
        </Button>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Prices are estimates and may vary. Final prices will be confirmed at booking.
      </p>
    </motion.div>
  );
}
