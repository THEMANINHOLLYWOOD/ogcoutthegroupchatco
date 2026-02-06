import { motion } from "framer-motion";
import { Plane, ArrowRight, Check } from "lucide-react";
import { TravelerCost } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface CostBreakdownProps {
  breakdown: TravelerCost;
  isLast?: boolean;
}

export function CostBreakdown({ breakdown, isLast }: CostBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "py-4",
        !isLast && "border-b border-border/50"
      )}
    >
      {/* Traveler Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {breakdown.traveler_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-foreground">{breakdown.traveler_name}</span>
        </div>
        <span className="text-lg font-bold text-foreground">
          ${breakdown.subtotal.toLocaleString()}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Plane className="w-3 h-3" />
        <span>{breakdown.origin}</span>
        <ArrowRight className="w-3 h-3" />
        <span>{breakdown.destination}</span>
        <span className="text-muted-foreground/50">· Round trip</span>
      </div>

      {/* Line Items */}
      <div className="space-y-1.5 text-sm pl-5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Flight</span>
          <span className="text-foreground">${breakdown.flight_cost.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Accommodation share</span>
          <span className="text-foreground">${breakdown.accommodation_share.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
