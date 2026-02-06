import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { TravelerCost } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TravelerPaymentStatusProps {
  travelers: TravelerCost[];
  paidTravelers: Set<string>;
  onPay?: (travelerName: string) => Promise<void>;
  isOrganizer?: boolean;
}

export function TravelerPaymentStatus({
  travelers,
  paidTravelers,
  onPay,
  isOrganizer = false,
}: TravelerPaymentStatusProps) {
  const [payingTraveler, setPayingTraveler] = useState<string | null>(null);
  const allPaid = travelers.length > 0 && travelers.every(t => paidTravelers.has(t.traveler_name));
  const paidCount = travelers.filter(t => paidTravelers.has(t.traveler_name)).length;

  const handlePay = async (travelerName: string) => {
    if (!onPay) return;
    setPayingTraveler(travelerName);
    try {
      await onPay(travelerName);
    } finally {
      setPayingTraveler(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Travelers</h3>
        <span className="text-sm text-muted-foreground">
          {paidCount}/{travelers.length} paid
        </span>
      </div>

      <div className="space-y-2">
        {travelers.map((traveler, index) => {
          const isPaid = paidTravelers.has(traveler.traveler_name);
          const isFirst = index === 0;
          const isPaying = payingTraveler === traveler.traveler_name;

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
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                  <AvatarImage src={traveler.avatar_url || undefined} />
                  <AvatarFallback className={cn(
                    "text-xs sm:text-sm font-semibold",
                    isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {getInitials(traveler.traveler_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-medium text-foreground text-sm sm:text-base truncate">
                      {traveler.traveler_name}
                    </span>
                    {isFirst && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">(Organizer)</span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ${traveler.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isPaid ? (
                  <motion.div
                    key="paid"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-1.5 sm:gap-2 text-primary shrink-0"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                    <span className="text-xs sm:text-sm font-medium">Paid</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pay"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="shrink-0"
                  >
                    <Button
                      size="sm"
                      className="rounded-full px-3 sm:px-4 h-9 sm:h-auto text-xs sm:text-sm"
                      onClick={() => handlePay(traveler.traveler_name)}
                      disabled={isPaying}
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          <span className="hidden sm:inline">Paying...</span>
                        </>
                      ) : (
                        <>
                          <span className="sm:hidden">Pay</span>
                          <span className="hidden sm:inline">Pay ${traveler.subtotal.toLocaleString()}</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {allPaid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-xs sm:text-sm text-primary font-medium"
        >
          ✨ All travelers have paid!
        </motion.div>
      )}
    </div>
  );
}
