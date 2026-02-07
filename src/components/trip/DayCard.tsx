import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { DayPlan } from "@/lib/tripTypes";
import { ActivityBubble } from "./ActivityBubble";
import { ReactionsMap, getReactionKey } from "@/lib/reactionService";

interface DayCardProps {
  day: DayPlan;
  isActive: boolean;
  reactions?: ReactionsMap;
  onReact?: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;
  canReact?: boolean;
}

export function DayCard({ 
  day, 
  isActive,
  reactions,
  onReact,
  canReact,
}: DayCardProps) {
  const date = parseISO(day.date);

  if (!isActive) return null;

  return (
    <motion.div
      key={day.day_number}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Day Header */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-foreground">
            Day {day.day_number}
          </span>
          <span className="text-muted-foreground">
            {format(date, "EEEE, MMMM d")}
          </span>
        </div>
        <p className="text-lg text-primary font-medium mt-1">
          {day.theme}
        </p>
      </div>

      {/* Activities */}
      <div className="space-y-3">
        {day.activities.map((activity, index) => (
          <ActivityBubble
            key={`${day.day_number}-${index}-${activity.title}`}
            activity={activity}
            index={index}
            dayNumber={day.day_number}
            reactions={reactions?.get(getReactionKey(day.day_number, index))}
            onReact={onReact ? (reaction) => onReact(day.day_number, index, reaction) : undefined}
            canReact={canReact}
          />
        ))}
      </div>
    </motion.div>
  );
}
