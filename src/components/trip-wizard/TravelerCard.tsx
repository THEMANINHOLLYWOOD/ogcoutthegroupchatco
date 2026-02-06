import { motion } from "framer-motion";
import { User, MapPin, X } from "lucide-react";
import { Airport, formatAirportShort } from "@/lib/airportSearch";
import { cn } from "@/lib/utils";

interface TravelerCardProps {
  name: string;
  origin: Airport;
  isOrganizer: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TravelerCard({ name, origin, isOrganizer, onRemove, className }: TravelerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative bg-background border border-border rounded-2xl p-4 flex items-center gap-4",
        isOrganizer && "border-primary/30 bg-primary/5",
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
        isOrganizer ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <User className="w-6 h-6" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{name}</span>
          {isOrganizer && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{formatAirportShort(origin)}</span>
        </div>
      </div>

      {/* Remove Button */}
      {!isOrganizer && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}
