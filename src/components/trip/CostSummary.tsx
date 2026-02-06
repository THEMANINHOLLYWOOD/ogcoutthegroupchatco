import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User } from "lucide-react";
import { TravelerCost, AccommodationOption } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface CostSummaryProps {
  breakdown: TravelerCost[];
  accommodation: AccommodationOption | null;
  totalPerPerson: number;
  tripTotal: number;
}

export function CostSummary({
  breakdown,
  accommodation,
  totalPerPerson,
  tripTotal,
}: CostSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div>
          <p className="text-sm text-muted-foreground">Trip Total</p>
          <p className="text-2xl font-bold text-foreground">
            ${tripTotal.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm">
            ~${totalPerPerson.toLocaleString()}/person
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Accommodation */}
              {accommodation && (
                <div className="p-3 rounded-xl bg-background border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {accommodation.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {accommodation.rating}★
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      ${accommodation.price_per_night}/night × {accommodation.total_nights} nights
                    </span>
                    <span className="font-medium text-foreground">
                      ${accommodation.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Per Person Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Per Person
                </p>
                {breakdown.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      "bg-primary/10 text-primary"
                    )}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {item.traveler_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From {item.origin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${item.subtotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Flight ${item.flight_cost} + Stay ${item.accommodation_share}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
