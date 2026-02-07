import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Itinerary } from "@/lib/tripTypes";
import { DayCard } from "./DayCard";
import { cn } from "@/lib/utils";
import { ReactionsMap, getReactionKey } from "@/lib/reactionService";

interface ItineraryViewProps {
  itinerary: Itinerary;
  tripId?: string;
  destinationCity?: string;
  destinationCountry?: string;
  onItineraryUpdate?: (updatedItinerary: Itinerary) => void;
  reactions?: ReactionsMap;
  onReact?: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;
  canReact?: boolean;
}

export function ItineraryView({ 
  itinerary,
  reactions,
  onReact,
  canReact,
}: ItineraryViewProps) {
  const [activeDay, setActiveDay] = useState(1);

  // Helper to count total reactions for a day
  const getDayReactionCount = (dayNumber: number): number => {
    if (!reactions) return 0;
    const day = itinerary.days.find(d => d.day_number === dayNumber);
    if (!day) return 0;
    
    let count = 0;
    day.activities.forEach((_, index) => {
      const key = getReactionKey(dayNumber, index);
      const reaction = reactions.get(key);
      if (reaction) {
        count += reaction.thumbs_up + reaction.thumbs_down;
      }
    });
    return count;
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
          {itinerary.days.map((day) => {
            const reactionCount = getDayReactionCount(day.day_number);
            return (
              <button
                key={day.day_number}
                onClick={() => setActiveDay(day.day_number)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeDay === day.day_number
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <span>Day {day.day_number}</span>
                {reactionCount > 0 && (
                  <span className="text-xs opacity-70">· {reactionCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Day Content */}
      <AnimatePresence mode="wait">
        {itinerary.days.map((day) => (
          <DayCard
            key={day.day_number}
            day={day}
            isActive={activeDay === day.day_number}
            reactions={reactions}
            onReact={onReact}
            canReact={canReact}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
