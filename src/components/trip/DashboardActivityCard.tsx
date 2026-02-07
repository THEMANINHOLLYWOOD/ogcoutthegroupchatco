import { motion } from "framer-motion";
import { Landmark, Utensils, Calendar, Plane, Coffee, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity } from "@/lib/tripTypes";
import { ReactionBubbles } from "./ReactionBubbles";
import { ReactionCounts } from "@/lib/reactionService";

interface DashboardActivityCardProps {
  activity: Activity;
  dayNumber: number;
  activityIndex: number;
  reactions: ReactionCounts;
  isOrganizer: boolean;
  allPaid: boolean;
  onReact: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;
  onRemove?: (dayNumber: number, activityIndex: number) => void;
  canReact: boolean;
}

const activityIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  event: Calendar,
  travel: Plane,
  free_time: Coffee,
};

const activityColors = {
  attraction: "bg-blue-500/10 text-blue-600",
  restaurant: "bg-orange-500/10 text-orange-600",
  event: "bg-purple-500/10 text-purple-600",
  travel: "bg-green-500/10 text-green-600",
  free_time: "bg-amber-500/10 text-amber-600",
};

export function DashboardActivityCard({
  activity,
  dayNumber,
  activityIndex,
  reactions,
  isOrganizer,
  allPaid,
  onReact,
  onRemove,
  canReact,
}: DashboardActivityCardProps) {
  const Icon = activityIcons[activity.type] || Landmark;
  const colorClass = activityColors[activity.type] || activityColors.attraction;
  const hasCost = activity.estimated_cost && activity.estimated_cost > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3"
    >
      {/* Header: Icon + Title + Time */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm leading-tight">
              {activity.title}
            </h4>
            <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {activity.time}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1">
            {activity.description}
          </p>
        </div>
      </div>

      {/* Footer: Cost + Reactions + Organizer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {hasCost && (
            <span className="text-[10px] sm:text-xs font-medium text-primary px-2 py-0.5 sm:py-1 bg-primary/10 rounded-full">
              ${activity.estimated_cost}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ReactionBubbles
            counts={reactions}
            onReact={(reaction) => onReact(dayNumber, activityIndex, reaction)}
            disabled={!canReact}
          />
          
          {isOrganizer && allPaid && onRemove && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(dayNumber, activityIndex)}
              className="w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 active:bg-destructive/25 transition-colors touch-manipulation"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
