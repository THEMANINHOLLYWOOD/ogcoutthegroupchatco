import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { DayPlan, Activity } from "@/lib/tripTypes";
import { ActivityBubble } from "./ActivityBubble";

interface DayCardProps {
  day: DayPlan;
  isActive: boolean;
  searchingActivity?: number | null;
  onFindAlternative?: (activityIndex: number, direction: 'cheaper' | 'pricier') => void;
}

export function DayCard({ 
  day, 
  isActive, 
  searchingActivity,
  onFindAlternative,
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
            isSearching={searchingActivity === index}
            onFindCheaper={
              onFindAlternative && activity.estimated_cost
                ? () => onFindAlternative(index, 'cheaper')
                : undefined
            }
            onFindPricier={
              onFindAlternative && activity.estimated_cost
                ? () => onFindAlternative(index, 'pricier')
                : undefined
            }
          />
        ))}
      </div>
    </motion.div>
  );
}
