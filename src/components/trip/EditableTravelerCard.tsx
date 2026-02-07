import { X, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Traveler } from "@/lib/tripTypes";
import { cn } from "@/lib/utils";

interface EditableTravelerCardProps {
  traveler: Traveler;
  onRemove?: () => void;
  isCompact?: boolean;
}

export function EditableTravelerCard({
  traveler,
  onRemove,
  isCompact = false,
}: EditableTravelerCardProps) {
  const initials = traveler.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
        isCompact && "p-2"
      )}
    >
      {/* Avatar */}
      <Avatar className={cn("h-10 w-10", isCompact && "h-8 w-8")}>
        <AvatarImage src={traveler.avatar_url} alt={traveler.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name and Origin */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-foreground truncate", isCompact && "text-sm")}>
            {traveler.name}
          </span>
          {traveler.isOrganizer && (
            <span className="text-xs text-muted-foreground">(You)</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{traveler.origin.iata}</span>
        </div>
      </div>

      {/* Remove button - only for non-organizers */}
      {!traveler.isOrganizer && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}
