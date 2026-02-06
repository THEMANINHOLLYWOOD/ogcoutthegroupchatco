import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarIcon, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { Airport, getUserLocationAirport } from "@/lib/airportSearch";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface TripDetailsStepProps {
  organizerName: string;
  onContinue: (data: { destination: Airport; origin: Airport; departureDate: Date; returnDate: Date }) => void;
}

export function TripDetailsStep({ organizerName, onContinue }: TripDetailsStepProps) {
  const [destination, setDestination] = useState<Airport | null>(null);
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  // Auto-detect user's location on mount
  useEffect(() => {
    const detectLocation = async () => {
      const nearestAirport = await getUserLocationAirport();
      if (nearestAirport) {
        setOrigin(nearestAirport);
      }
      setIsDetectingLocation(false);
    };
    detectLocation();
  }, []);

  const isValid = destination && origin && dateRange?.from && dateRange?.to;

  const handleContinue = () => {
    if (isValid) {
      onContinue({
        destination,
        origin,
        departureDate: dateRange.from!,
        returnDate: dateRange.to!,
      });
    }
  };

  const today = startOfToday();
  const tomorrow = addDays(today, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
          Where are you headed, {organizerName.split(" ")[0]}?
        </h1>
        <p className="text-muted-foreground text-lg">
          Tell us about your trip
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Destination */}
        <AirportAutocomplete
          value={destination}
          onChange={setDestination}
          placeholder="Where to?"
          label="Destination"
        />

        {/* Origin */}
        <AirportAutocomplete
          value={origin}
          onChange={setOrigin}
          placeholder={isDetectingLocation ? "Detecting your location..." : "Leaving from?"}
          label="Departing from"
          showGeolocation
        />

        {/* Visual Route */}
        {destination && origin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{origin.iata}</div>
                <div className="text-xs text-muted-foreground">{origin.city}</div>
              </div>
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="h-px bg-primary/30 flex-1" />
                <Plane className="w-5 h-5 text-primary mx-2 rotate-0" />
                <div className="h-px bg-primary/30 flex-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{destination.iata}</div>
                <div className="text-xs text-muted-foreground">{destination.city}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Date Range Picker */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            When?
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal rounded-xl bg-muted/50 border-border",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Select travel dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tomorrow}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => isBefore(date, tomorrow)}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Display */}
        {dateRange?.from && dateRange?.to && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-muted/30 rounded-xl p-4"
          >
            <div>
              <div className="text-xs text-muted-foreground">Departure</div>
              <div className="font-medium text-foreground">{format(dateRange.from, "EEE, MMM d")}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Return</div>
              <div className="font-medium text-foreground">{format(dateRange.to, "EEE, MMM d")}</div>
            </div>
            <div className="text-right pl-4 border-l border-border">
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="font-medium text-foreground">
                {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full h-12 rounded-xl text-base font-medium"
          size="lg"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
