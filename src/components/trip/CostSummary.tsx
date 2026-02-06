import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User, Sparkles, Plus, Check } from "lucide-react";
import { TravelerCost, AccommodationOption, Itinerary } from "@/lib/tripTypes";
import { calculateSelectedActivitiesCost, getTotalAvailableActivitiesCost } from "@/lib/tripService";
import { DayCostRow } from "./DayCostRow";
import { cn } from "@/lib/utils";

interface CostSummaryProps {
  breakdown: TravelerCost[];
  accommodation: AccommodationOption | null;
  totalPerPerson: number;
  tripTotal: number;
  itinerary?: Itinerary | null;
  travelerCount?: number;
  selectedActivities: Set<string>;
  onToggleActivity: (dayNumber: number, activityIndex: number) => void;
  onAddAllActivities: () => void;
  onAddDayActivities: (dayNumber: number) => void;
  onRemoveDayActivities: (dayNumber: number) => void;
}

export function CostSummary({
  breakdown,
  accommodation,
  totalPerPerson,
  tripTotal,
  itinerary,
  travelerCount = 1,
  selectedActivities,
  onToggleActivity,
  onAddAllActivities,
  onAddDayActivities,
  onRemoveDayActivities,
}: CostSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedActivitiesCost = calculateSelectedActivitiesCost(itinerary || null, selectedActivities);
  const totalAvailableCost = getTotalAvailableActivitiesCost(itinerary || null);
  const totalSelectedCost = selectedActivitiesCost * travelerCount;
  const adjustedTripTotal = tripTotal + totalSelectedCost;
  const adjustedPerPerson = totalPerPerson + selectedActivitiesCost;

  const hasPaidActivities = totalAvailableCost > 0;
  
  // Check if all paid activities are selected
  const allActivitiesSelected = itinerary?.days.every(day => 
    day.activities.every((activity, index) => {
      if ((activity.estimated_cost || 0) === 0) return true;
      return selectedActivities.has(`${day.day_number}-${index}`);
    })
  ) ?? false;

  return (
    <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div>
          <p className="text-sm text-muted-foreground">Base Trip Cost</p>
          <div className="flex items-baseline gap-2">
            <motion.p 
              key={adjustedTripTotal}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-foreground tabular-nums"
            >
              ${adjustedTripTotal.toLocaleString()}
            </motion.p>
            {selectedActivitiesCost > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-primary font-medium"
              >
                +${totalSelectedCost} activities
              </motion.span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-sm tabular-nums">
            ~${adjustedPerPerson.toLocaleString()}/person
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
            <div className="px-4 pb-4 space-y-4">
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

              {/* Activities Section */}
              {hasPaidActivities && itinerary && (
                <div className="p-3 rounded-xl bg-background border border-border/50">
                  {/* Activities Header with Add All */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">
                        Activities & Experiences
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        ${totalAvailableCost}/person
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddAllActivities();
                        }}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                          allActivitiesSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        {allActivitiesSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Day-by-day breakdown */}
                  <div className="space-y-1">
                    {itinerary.days.map((day) => (
                      <DayCostRow
                        key={day.day_number}
                        dayNumber={day.day_number}
                        activities={day.activities}
                        selectedActivities={selectedActivities}
                        onToggleActivity={onToggleActivity}
                        onAddAllDay={onAddDayActivities}
                        onRemoveAllDay={onRemoveDayActivities}
                      />
                    ))}
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
                      <motion.p 
                        key={item.subtotal + selectedActivitiesCost}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="font-semibold text-foreground tabular-nums"
                      >
                        ${(item.subtotal + selectedActivitiesCost).toLocaleString()}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">
                        Flight ${item.flight_cost} + Stay ${item.accommodation_share}
                        {selectedActivitiesCost > 0 && ` + Activities $${selectedActivitiesCost}`}
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
