import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Check, AlertCircle, FileText } from "lucide-react";
import { SavedTrip, TravelerCost } from "@/lib/tripTypes";
import { format, parseISO, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: SavedTrip;
}

function formatDateRange(departure: string, returnDate: string): string {
  const dep = parseISO(departure);
  const ret = parseISO(returnDate);
  const depMonth = format(dep, "MMM");
  const retMonth = format(ret, "MMM");
  
  if (depMonth === retMonth) {
    return `${format(dep, "MMM d")}-${format(ret, "d, yyyy")}`;
  }
  return `${format(dep, "MMM d")} - ${format(ret, "MMM d, yyyy")}`;
}

function getTripStatus(trip: SavedTrip): {
  label: string;
  icon: typeof Clock;
  className: string;
} {
  // No link created yet = Draft
  if (!trip.link_created_at) {
    return {
      label: "Draft",
      icon: FileText,
      className: "bg-muted text-muted-foreground",
    };
  }

  // Check if expired
  if (trip.link_expires_at && isPast(parseISO(trip.link_expires_at))) {
    return {
      label: "Expired",
      icon: AlertCircle,
      className: "bg-destructive/10 text-destructive",
    };
  }

  // Check if all travelers paid (mock logic - no payment_status field yet)
  // For now, we'll use link_expires_at being set as "active"
  if (trip.link_expires_at) {
    const expiresAt = parseISO(trip.link_expires_at);
    const hoursRemaining = differenceInHours(expiresAt, new Date());
    const minutesRemaining = differenceInMinutes(expiresAt, new Date());

    if (hoursRemaining > 0) {
      return {
        label: `${hoursRemaining}h remaining`,
        icon: Clock,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      };
    } else if (minutesRemaining > 0) {
      return {
        label: `${minutesRemaining}m remaining`,
        icon: Clock,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      };
    }
  }

  // Default to confirmed (placeholder)
  return {
    label: "Confirmed",
    icon: Check,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
}

export function TripCard({ trip }: TripCardProps) {
  const status = getTripStatus(trip);
  const StatusIcon = status.icon;
  const travelers = trip.travelers as TravelerCost[];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <Link to={`/trip/${trip.id}/dashboard`} className="block p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold text-foreground truncate">
              📍 {trip.destination_city}, {trip.destination_country}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(trip.departure_date, trip.return_date)}
            </p>
            <p className="text-xs text-muted-foreground">
              {travelers.length} {travelers.length === 1 ? "traveler" : "travelers"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                status.className
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
