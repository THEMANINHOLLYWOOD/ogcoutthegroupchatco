import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TravelerCost } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface TravelerPaymentDrawerProps {
  travelers: TravelerCost[];
  paidTravelers: Set<string>;
  onPay: (travelerName: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TravelerPaymentDrawer({
  travelers,
  paidTravelers,
  onPay,
  open,
  onOpenChange,
}: TravelerPaymentDrawerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [justPaid, setJustPaid] = useState<string | null>(null);

  const unpaidTravelers = travelers.filter(t => !paidTravelers.has(t.traveler_name));
  const allPaid = unpaidTravelers.length === 0;

  // Reset selection when drawer opens
  useEffect(() => {
    if (open) {
      setSelected(null);
      setJustPaid(null);
    }
  }, [open]);

  const selectedTraveler = travelers.find(t => t.traveler_name === selected);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePay = async () => {
    if (!selected) return;
    setIsPaying(true);
    try {
      await onPay(selected);
      setJustPaid(selected);
      // Close after showing success briefly
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle>
            {allPaid ? "All travelers have paid!" : justPaid ? "Payment confirmed!" : "Who are you paying for?"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {justPaid ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{justPaid}</p>
                  <p className="text-sm text-muted-foreground">Spot secured!</p>
                </div>
              </motion.div>
            ) : allPaid ? (
              <motion.div
                key="all-paid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Everyone is confirmed for this trip! ✨
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <RadioGroup
                  value={selected || ""}
                  onValueChange={setSelected}
                  className="space-y-2"
                >
                  {unpaidTravelers.map((traveler, index) => {
                    const isSelected = selected === traveler.traveler_name;
                    const isFirst = travelers.findIndex(t => t.traveler_name === traveler.traveler_name) === 0;

                    return (
                      <motion.label
                        key={traveler.traveler_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        htmlFor={traveler.traveler_name}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border",
                          isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/30 border-transparent hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem
                          value={traveler.traveler_name}
                          id={traveler.traveler_name}
                          className="shrink-0"
                        />
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarImage src={traveler.avatar_url || undefined} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                            {getInitials(traveler.traveler_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {traveler.traveler_name}
                            </span>
                            {isFirst && (
                              <span className="text-xs text-muted-foreground">(Organizer)</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ${traveler.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </motion.label>
                    );
                  })}
                </RadioGroup>

                <Button
                  onClick={handlePay}
                  disabled={!selected || isPaying}
                  className="w-full h-12 rounded-xl text-base font-medium mt-4"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {selectedTraveler ? `$${selectedTraveler.subtotal.toLocaleString()}` : ""}
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
