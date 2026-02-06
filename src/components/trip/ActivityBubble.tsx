import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Utensils, Ticket, Plane, Coffee, Plus, Minus, Loader2 } from "lucide-react";
import { Activity } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface ActivityBubbleProps {
  activity: Activity;
  index: number;
  isSearching?: boolean;
  onFindCheaper?: () => void;
  onFindPricier?: () => void;
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
  isSearching = false,
  onFindCheaper,
  onFindPricier,
}: ActivityBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              "shadow-sm hover:shadow-md transition-shadow duration-200",
              activity.is_live_event && "border-l-2 border-l-red-500"
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
                  
                  {/* Live Event Indicator */}
                  {activity.is_live_event && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1"
                    >
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-xs font-medium text-destructive">LIVE</span>
                    </motion.div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
                
                {/* Footer with cost, tip, and +/- controls */}
                <div className="flex items-center justify-between mt-2 gap-2">
                  <div className="flex items-center gap-4 flex-wrap flex-1">
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

                  {/* Price adjustment controls */}
                  {hasCost && (onFindCheaper || onFindPricier) && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isHovered || isSearching ? 1 : 0.6, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1"
                      >
                        <motion.button
                          onClick={onFindCheaper}
                          disabled={isSearching}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            "bg-muted hover:bg-primary/10 hover:text-primary",
                            "text-muted-foreground transition-colors",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          title="Find cheaper alternative"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={onFindPricier}
                          disabled={isSearching}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            "bg-muted hover:bg-primary/10 hover:text-primary",
                            "text-muted-foreground transition-colors",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                          title="Find premium alternative"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Finding alternatives...</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
