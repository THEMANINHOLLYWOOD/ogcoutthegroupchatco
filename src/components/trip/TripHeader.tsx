import { motion } from "framer-motion";
import { Calendar, Users, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TripHeaderProps {
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  organizerName: string;
}

export function TripHeader({
  destinationCity,
  destinationCountry,
  departureDate,
  returnDate,
  travelerCount,
  organizerName,
}: TripHeaderProps) {
  const start = parseISO(departureDate);
  const end = parseISO(returnDate);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Unsplash image for the destination
  const imageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(destinationCity)},city,travel`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-64 md:h-80 w-full overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{destinationCountry}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {destinationCity}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-foreground">
                {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
              </span>
              <span className="text-muted-foreground">({nights} nights)</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <Users className="w-4 h-4 text-primary" />
              <span className="text-foreground">{travelerCount} travelers</span>
            </motion.div>
          </div>
          
          <p className="text-muted-foreground text-sm mt-3">
            Organized by {organizerName}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
