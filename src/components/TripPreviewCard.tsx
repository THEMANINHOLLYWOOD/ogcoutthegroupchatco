import { motion } from "framer-motion";
import { MapPin, Calendar, Users, DollarSign } from "lucide-react";

interface TripPreviewCardProps {
  destination: string;
  dates: string;
  travelers: number;
  pricePerPerson: number;
  imageUrl?: string;
  delay?: number;
}

export const TripPreviewCard = ({
  destination,
  dates,
  travelers,
  pricePerPerson,
  imageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  delay = 0,
}: TripPreviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-soft border border-border cursor-pointer transition-shadow hover:shadow-glass"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {destination}
          </h3>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{dates}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{travelers} travelers</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-primary font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{pricePerPerson}</span>
            <span className="text-muted-foreground font-normal text-sm">/person</span>
          </div>
          <div className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full">
            I'm In
          </div>
        </div>
      </div>

      {/* iMessage link preview footer */}
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground truncate">
          ogcoutthegroupchat.lovable.app/trip/X7KM3P
        </p>
      </div>
    </motion.div>
  );
};
