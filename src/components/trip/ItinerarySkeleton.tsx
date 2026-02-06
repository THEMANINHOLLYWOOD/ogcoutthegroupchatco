import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export function ItinerarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Generating Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <p className="font-medium text-foreground">Building your itinerary...</p>
          <p className="text-sm text-muted-foreground">
            Searching for the best experiences and live events
          </p>
        </div>
      </motion.div>

      {/* Day Pills Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Day Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Activities Skeleton */}
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-3"
          >
            <Skeleton className="h-4 w-14 flex-shrink-0" />
            <div className="flex-1 space-y-2 p-4 rounded-2xl border border-border/50 bg-muted/30">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
