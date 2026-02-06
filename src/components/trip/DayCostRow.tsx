import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, Check } from "lucide-react";
import { Activity } from "@/lib/tripTypes";
import { ActivityCostItem } from "./ActivityCostItem";
import { cn } from "@/lib/utils";

interface DayCostRowProps {
  dayNumber: number;
  activities: Activity[];
  selectedActivities: Set<string>;
  onToggleActivity: (dayNumber: number, activityIndex: number) => void;
  onAddAllDay: (dayNumber: number) => void;
  onRemoveAllDay: (dayNumber: number) => void;
}

export function DayCostRow({
  dayNumber,
  activities,
  selectedActivities,
  onToggleActivity,
  onAddAllDay,
  onRemoveAllDay,
}: DayCostRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const paidActivities = activities.filter(a => (a.estimated_cost || 0) > 0);
  const paidCount = paidActivities.length;
  
  if (paidCount === 0) return null;

  const dayCost = paidActivities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
  
  const selectedCount = activities.reduce((count, _, index) => {
    const key = `${dayNumber}-${index}`;
    return selectedActivities.has(key) ? count + 1 : count;
  }, 0);
  
  const selectedDayCost = activities.reduce((sum, activity, index) => {
    const key = `${dayNumber}-${index}`;
    if (selectedActivities.has(key)) {
      return sum + (activity.estimated_cost || 0);
    }
    return sum;
  }, 0);

  const allDaySelected = paidActivities.every((_, idx) => {
    const originalIndex = activities.findIndex((a, i) => 
      (a.estimated_cost || 0) > 0 && 
      activities.slice(0, i).filter(act => (act.estimated_cost || 0) > 0).length === idx
    );
    return selectedActivities.has(`${dayNumber}-${originalIndex}`);
  });

  const handleDayAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allDaySelected) {
      onRemoveAllDay(dayNumber);
    } else {
      onAddAllDay(dayNumber);
    }
  };

  return (
    <motion.div layout className="overflow-hidden">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.div>
          <span className="text-sm font-medium text-foreground">Day {dayNumber}</span>
          <span className="text-xs text-muted-foreground">
            {paidCount} paid
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <motion.span 
              key={selectedDayCost}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm tabular-nums",
                selectedDayCost > 0 ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {selectedDayCost > 0 ? `$${selectedDayCost}` : `$${dayCost} available`}
            </motion.span>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleDayAction}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
              allDaySelected
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {allDaySelected ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="pl-6 pr-2 pb-2 space-y-0.5">
              {activities.map((activity, index) => {
                const key = `${dayNumber}-${index}`;
                const isSelected = selectedActivities.has(key);
                
                return (
                  <ActivityCostItem
                    key={index}
                    activity={activity}
                    isSelected={isSelected}
                    onToggle={() => onToggleActivity(dayNumber, index)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
