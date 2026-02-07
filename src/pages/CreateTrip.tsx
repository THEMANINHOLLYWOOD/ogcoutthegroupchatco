import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TripDetailsStep } from "@/components/trip-wizard/TripDetailsStep";
import { AddTravelersStep } from "@/components/trip-wizard/AddTravelersStep";
import { SearchingStep } from "@/components/trip-wizard/SearchingStep";
import { TripSummaryStep } from "@/components/trip-wizard/TripSummaryStep";
import { Airport } from "@/lib/airportSearch";
import { Traveler, TripResult } from "@/lib/tripTypes";
import { searchTrip } from "@/lib/tripSearch";
import { saveTrip } from "@/lib/tripService";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { getUserDocument, SavedDocument } from "@/lib/travelerService";

type Step = "trip-details" | "travelers" | "searching" | "summary";

const stepNumbers: Record<Step, number> = {
  "trip-details": 1,
  travelers: 2,
  searching: 2,
  summary: 3,
};

const totalSteps = 3;

export default function CreateTrip() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>("trip-details");
  const [isSharing, setIsSharing] = useState(false);
  
  // Trip state
  const [destination, setDestination] = useState<Airport | null>(null);
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [savedDocument, setSavedDocument] = useState<SavedDocument | null>(null);

  // Fetch user's saved travel document on mount
  useEffect(() => {
    if (user?.id) {
      getUserDocument(user.id).then((doc) => {
        if (doc) {
          setSavedDocument(doc);
        }
      });
    }
  }, [user?.id]);

  // Get organizer name from profile or default
  const organizerName = profile?.full_name || "Traveler";

  const handleTripDetailsContinue = useCallback((data: { destination: Airport; origin: Airport; departureDate: Date; returnDate: Date }) => {
    setDestination(data.destination);
    setOrigin(data.origin);
    setDepartureDate(data.departureDate);
    setReturnDate(data.returnDate);
    setStep("travelers");
  }, []);

  const handleTravelersContinue = useCallback(async (travelersList: Traveler[]) => {
    setTravelers(travelersList);
    setStep("searching");

    // Use saved document info if available, otherwise fall back to profile name
    const organizerInfo = savedDocument
      ? {
          first_name: savedDocument.first_name,
          last_name: savedDocument.last_name,
          document_type: savedDocument.document_type as "passport" | "drivers_license" | "national_id" | "unknown",
          confidence: "high" as const,
          full_legal_name: savedDocument.full_legal_name,
          date_of_birth: savedDocument.date_of_birth,
          document_number: savedDocument.document_number,
          expiration_date: savedDocument.expiration_date,
          nationality: savedDocument.nationality,
          gender: savedDocument.gender as "M" | "F" | "X" | "unknown" | undefined,
        }
      : {
          first_name: organizerName.split(" ")[0] || "Traveler",
          last_name: organizerName.split(" ").slice(1).join(" ") || "",
          document_type: "passport" as const,
          confidence: "high" as const,
        };

    // Call the search API
    const result = await searchTrip({
      organizer: organizerInfo,
      destination: destination!,
      origin: origin!,
      travelers: travelersList,
      departureDate: departureDate!,
      returnDate: returnDate!,
    });

    if (result.success && result.data) {
      setTripResult(result.data);
      setStep("summary");
    } else {
      toast({
        title: "Search Failed",
        description: result.error || "Could not find trip options",
        variant: "destructive",
      });
      setStep("travelers");
    }
  }, [organizerName, destination, origin, departureDate, returnDate, savedDocument]);

  const handleEditTrip = useCallback(() => {
    setStep("trip-details");
    setTripResult(null);
  }, []);

  const handleShareTrip = useCallback(async () => {
    if (!tripResult || !destination || !departureDate || !returnDate) return;
    
    setIsSharing(true);
    toast({
      title: "Creating your trip...",
      description: "Hang tight while we set everything up",
    });
    
    const result = await saveTrip({
      organizerName,
      destinationCity: destination.city,
      destinationCountry: destination.country,
      destinationIata: destination.iata,
      departureDate: format(departureDate, "yyyy-MM-dd"),
      returnDate: format(returnDate, "yyyy-MM-dd"),
      travelers: tripResult.breakdown,
      flights: tripResult.flights,
      accommodation: tripResult.accommodation,
      costBreakdown: tripResult.breakdown,
      totalPerPerson: tripResult.total_per_person,
      tripTotal: tripResult.trip_total,
    });

    setIsSharing(false);

    if (result.success && result.tripId) {
      navigate(`/trip/${result.tripId}`);
    } else {
      toast({
        title: "Failed to create trip",
        description: result.error || "Please try again",
        variant: "destructive",
      });
    }
  }, [tripResult, destination, departureDate, returnDate, organizerName, navigate]);

  const currentStepNumber = stepNumbers[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="text-sm text-muted-foreground">
            Step {currentStepNumber} of {totalSteps}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:py-12">
        <AnimatePresence mode="wait">
          {step === "trip-details" && (
            <motion.div
              key="trip-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TripDetailsStep
                organizerName={organizerName}
                onContinue={handleTripDetailsContinue}
              />
            </motion.div>
          )}

          {step === "travelers" && origin && destination && (
            <motion.div
              key="travelers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AddTravelersStep
                organizerName={organizerName}
                defaultOrigin={origin}
                destination={destination}
                onContinue={handleTravelersContinue}
                onBack={() => setStep("trip-details")}
              />
            </motion.div>
          )}

          {step === "searching" && destination && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchingStep
                destination={destination.city}
                travelerCount={travelers.length}
              />
            </motion.div>
          )}

          {step === "summary" && tripResult && destination && departureDate && returnDate && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TripSummaryStep
                result={tripResult}
                destination={destination}
                departureDate={departureDate}
                returnDate={returnDate}
                travelers={travelers}
                onEdit={handleEditTrip}
                onShare={handleShareTrip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
