import { motion } from "framer-motion";
import { Check, User } from "lucide-react";
import { TravelerCost } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface TravelerPaymentStatusProps {
  travelers: TravelerCost[];
  paidTravelers: Set<string>;
  onTogglePaid?: (travelerName: string) => void;
  isOrganizer?: boolean;
}

export function TravelerPaymentStatus({
  travelers,
  paidTravelers,
  onTogglePaid,
  isOrganizer = false,
}: TravelerPaymentStatusProps) {
  const allPaid = travelers.length > 0 && travelers.every(t => paidTravelers.has(t.traveler_name));
  const paidCount = travelers.filter(t => paidTravelers.has(t.traveler_name)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Travelers</h3>
        <span className="text-sm text-muted-foreground">
          {paidCount}/{travelers.length} paid
        </span>
      </div>

      <div className="space-y-2">
        {travelers.map((traveler, index) => {
          const isPaid = paidTravelers.has(traveler.traveler_name);
          const isFirst = index === 0;

          return (
            <motion.div
              key={traveler.traveler_name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-colors",
                isPaid ? "bg-primary/5" : "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    {traveler.traveler_name}
                  </span>
                  {isFirst && (
                    <span className="ml-2 text-xs text-muted-foreground">(Organizer)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  ${traveler.subtotal.toLocaleString()}
                </span>

                {isOrganizer ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onTogglePaid?.(traveler.traveler_name)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isPaid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border hover:border-primary/50"
                    )}
                  >
                    {isPaid && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isPaid ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {isPaid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-muted-foreground"
                      />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {allPaid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-sm text-primary font-medium"
        >
          ✨ All travelers have paid!
        </motion.div>
      )}
    </div>
  );
}
