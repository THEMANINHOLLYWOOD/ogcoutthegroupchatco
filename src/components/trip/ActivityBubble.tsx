import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Utensils, Ticket, Plane, Coffee } from "lucide-react";
import { Activity } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface ActivityBubbleProps {
  activity: Activity;
  index: number;
}

const typeIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  event: Ticket,
  travel: Plane,
  free_time: Coffee,
};

const typeColors = {
  attraction: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  restaurant: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  event: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  travel: "bg-green-500/10 text-green-600 dark:text-green-400",
  free_time: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function ActivityBubble({ 
  activity, 
  index, 
}: ActivityBubbleProps) {
  const Icon = typeIcons[activity.type] || Landmark;
  const colorClasses = typeColors[activity.type] || typeColors.attraction;
  const hasCost = activity.estimated_cost !== undefined && activity.estimated_cost > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className="flex gap-3"
    >
      {/* Time */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-xs font-medium text-muted-foreground">
          {activity.time}
        </span>
      </div>
      
      {/* Bubble */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activity.title}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className={cn(
              "rounded-2xl rounded-tl-sm p-4",
              "bg-muted/50 border border-border/50",
              "shadow-sm hover:shadow-md transition-shadow duration-200"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClasses)}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground text-sm">
                    {activity.title}
                  </h4>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
                
                {/* Footer with cost and tip */}
                <div className="flex items-center gap-4 flex-wrap mt-2">
                  {hasCost && (
                    <span className="text-xs font-medium text-primary">
                      ~${activity.estimated_cost}/person
                    </span>
                  )}
                  
                  {activity.tip && (
                    <span className="text-xs text-muted-foreground italic">
                      💡 {activity.tip}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
