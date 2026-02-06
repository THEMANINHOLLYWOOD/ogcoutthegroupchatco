import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Itinerary, Activity } from "@/lib/tripTypes";
import { DayCard } from "./DayCard";
import { findAlternativeActivity } from "@/lib/tripService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ItineraryViewProps {
  itinerary: Itinerary;
  tripId?: string;
  destinationCity?: string;
  destinationCountry?: string;
  onItineraryUpdate?: (updatedItinerary: Itinerary) => void;
}

export function ItineraryView({ 
  itinerary: initialItinerary, 
  tripId,
  destinationCity,
  destinationCountry,
  onItineraryUpdate,
}: ItineraryViewProps) {
  const [activeDay, setActiveDay] = useState(1);
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [searchingActivity, setSearchingActivity] = useState<{
    dayNumber: number;
    activityIndex: number;
  } | null>(null);

  const handleFindAlternative = async (
    dayNumber: number,
    activityIndex: number,
    direction: 'cheaper' | 'pricier'
  ) => {
    if (!tripId || !destinationCity || !destinationCountry) {
      toast.error("Cannot modify itinerary");
      return;
    }

    const day = itinerary.days.find(d => d.day_number === dayNumber);
    if (!day) return;

    const currentActivity = day.activities[activityIndex];
    if (!currentActivity) return;

    setSearchingActivity({ dayNumber, activityIndex });

    try {
      const result = await findAlternativeActivity({
        tripId,
        dayNumber,
        activityIndex,
        currentActivity,
        priceDirection: direction,
        destinationCity,
        destinationCountry,
        date: day.date,
      });

      if (result.success && result.activity) {
        // Update the local itinerary state
        const updatedItinerary = {
          ...itinerary,
          days: itinerary.days.map(d => {
            if (d.day_number === dayNumber) {
              return {
                ...d,
                activities: d.activities.map((a, i) => 
                  i === activityIndex ? result.activity! : a
                ),
              };
            }
            return d;
          }),
        };

        setItinerary(updatedItinerary);
        onItineraryUpdate?.(updatedItinerary);

        toast.success(
          direction === 'cheaper' 
            ? `Found a cheaper option: ${result.activity.title}` 
            : `Found a premium option: ${result.activity.title}`
        );
      } else {
        toast.error(result.error || `Couldn't find a ${direction} option`);
      }
    } catch (error) {
      console.error("Error finding alternative:", error);
      toast.error("Failed to find alternative");
    } finally {
      setSearchingActivity(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <p className="text-lg text-muted-foreground leading-relaxed">
          {itinerary.overview}
        </p>
        
        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {itinerary.highlights.map((highlight, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              ✨ {highlight}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Day Navigation */}
      <div className="sticky top-14 z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {itinerary.days.map((day) => (
            <button
              key={day.day_number}
              onClick={() => setActiveDay(day.day_number)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                activeDay === day.day_number
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Day {day.day_number}
            </button>
          ))}
        </div>
      </div>

      {/* Active Day Content */}
      <AnimatePresence mode="wait">
        {itinerary.days.map((day) => (
          <DayCard
            key={day.day_number}
            day={day}
            isActive={activeDay === day.day_number}
            searchingActivity={
              searchingActivity?.dayNumber === day.day_number
                ? searchingActivity.activityIndex
                : null
            }
            onFindAlternative={(activityIndex, direction) => 
              handleFindAlternative(day.day_number, activityIndex, direction)
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
