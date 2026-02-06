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
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 sm:p-8 text-center"
    >
      {/* Decorative sparkles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-3 right-3 sm:top-4 sm:right-4"
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary/30" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"
      >
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary/20" />
      </motion.div>

      {/* Plane icon */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4"
      >
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </motion.div>
      </motion.div>

      {/* Main message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm sm:text-lg text-muted-foreground mb-1">You are going to</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
          {destinationCity}!
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">{destinationCountry}</p>
      </motion.div>

      {/* Trip details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground"
      >
        <span>{formatDate(departureDate)} – {formatDate(returnDate)}</span>
        <span className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
        <span>{travelerCount} travelers confirmed</span>
      </motion.div>

      {/* Celebration message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 sm:mt-6 text-xs sm:text-base text-primary font-medium"
      >
        ✨ All payments received – trip is locked in!
      </motion.p>
    </motion.div>
  );
}
