import { motion } from "framer-motion";
import { Plane, Sparkles } from "lucide-react";

interface ConfirmationBannerProps {
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
}

export function ConfirmationBanner({
  destinationCity,
  destinationCountry,
  departureDate,
  returnDate,
  travelerCount,
}: ConfirmationBannerProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 text-center"
    >
      {/* Decorative sparkles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-4 right-4"
      >
        <Sparkles className="w-6 h-6 text-primary/30" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-4 left-4"
      >
        <Sparkles className="w-4 h-4 text-primary/20" />
      </motion.div>

      {/* Plane icon */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
      >
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plane className="w-8 h-8 text-primary" />
        </motion.div>
      </motion.div>

      {/* Main message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-lg text-muted-foreground mb-1">You are going to</p>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {destinationCity}!
        </h2>
        <p className="text-muted-foreground">{destinationCountry}</p>
      </motion.div>

      {/* Trip details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground"
      >
        <span>{formatDate(departureDate)} – {formatDate(returnDate)}</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
        <span>{travelerCount} travelers confirmed</span>
      </motion.div>

      {/* Celebration message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-primary font-medium"
      >
        ✨ All payments received – trip is locked in!
      </motion.p>
    </motion.div>
  );
}
