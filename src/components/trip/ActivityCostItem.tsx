import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Activity } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface ActivityCostItemProps {
  activity: Activity;
  isSelected: boolean;
  onToggle: () => void;
}

export function ActivityCostItem({ 
  activity, 
  isSelected, 
  onToggle 
}: ActivityCostItemProps) {
  const cost = activity.estimated_cost || 0;
  const isFree = cost === 0;

  if (isFree) {
    return (
      <div className="flex items-center justify-between py-2 px-2 text-muted-foreground">
        <span className="text-sm truncate flex-1">{activity.title}</span>
        <span className="text-xs">Free</span>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <motion.div
          animate={{ 
            scale: isSelected ? 1 : 0.85,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
            isSelected 
              ? "border-primary bg-primary" 
              : "border-muted-foreground/40"
          )}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
            />
          )}
        </motion.div>
        <span className={cn(
          "text-sm truncate transition-colors duration-150",
          isSelected ? "text-foreground" : "text-muted-foreground"
        )}>
          {activity.title}
        </span>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn(
          "text-xs tabular-nums transition-colors duration-150",
          isSelected ? "text-foreground" : "text-muted-foreground"
        )}>
          ${cost}
        </span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            isSelected 
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          {isSelected ? (
            <Minus className="w-3 h-3" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
