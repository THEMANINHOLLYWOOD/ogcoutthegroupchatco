import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Itinerary } from "@/lib/tripTypes";
import { ReactionsMap, getReactionKey, ReactionCounts } from "@/lib/reactionService";
import { DashboardActivityCard } from "./DashboardActivityCard";

interface DashboardItineraryViewProps {
  itinerary: Itinerary | null;
  tripId: string;
  reactions: ReactionsMap;
  isOrganizer: boolean;
  allPaid: boolean;
  canReact: boolean;
  onReact: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;
  onRemoveActivity?: (dayNumber: number, activityIndex: number) => void;
  onAddActivity?: (dayNumber: number) => void;
  isLoading?: boolean;
}

const defaultReactionCounts: ReactionCounts = {
  thumbs_up: 0,
  thumbs_down: 0,
  user_reaction: null,
};

export function DashboardItineraryView({
  itinerary,
  tripId,
  reactions,
  isOrganizer,
  allPaid,
  canReact,
  onReact,
  onRemoveActivity,
  onAddActivity,
  isLoading,
}: DashboardItineraryViewProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No itinerary yet</p>
      </div>
    );
  }

  const days = itinerary.days;
  const currentDay = days.find(d => d.day_number === selectedDay) || days[0];

  return (
    <div className="space-y-4">
      {/* Day Tabs - Horizontal scroll */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {days.map((day) => (
          <motion.button
            key={day.day_number}
            onClick={() => setSelectedDay(day.day_number)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              "transition-colors duration-200 touch-manipulation",
              "scroll-snap-align-start",
              selectedDay === day.day_number
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Day {day.day_number}
          </motion.button>
        ))}
      </div>

      {/* Day Theme */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date(currentDay.date).toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "short", 
              day: "numeric" 
            })}
          </p>
          <h4 className="font-medium text-foreground">{currentDay.theme}</h4>
        </div>
        {isOrganizer && allPaid && onAddActivity && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onAddActivity(currentDay.day_number)}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Activities */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {currentDay.activities.map((activity, index) => {
            const reactionKey = getReactionKey(currentDay.day_number, index);
            const activityReactions = reactions.get(reactionKey) || defaultReactionCounts;

            return (
              <DashboardActivityCard
                key={`${currentDay.day_number}-${index}`}
                activity={activity}
                dayNumber={currentDay.day_number}
                activityIndex={index}
                reactions={activityReactions}
                isOrganizer={isOrganizer}
                allPaid={allPaid}
                onReact={onReact}
                onRemove={onRemoveActivity}
                canReact={canReact}
              />
            );
          })}
        </div>
      </AnimatePresence>

      {/* Empty state for day */}
      {currentDay.activities.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No activities planned for this day</p>
          {isOrganizer && allPaid && onAddActivity && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAddActivity(currentDay.day_number)}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
