import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { YourInfoStep } from "@/components/trip-wizard/YourInfoStep";
import { TripDetailsStep } from "@/components/trip-wizard/TripDetailsStep";
import { AddTravelersStep } from "@/components/trip-wizard/AddTravelersStep";
import { SearchingStep } from "@/components/trip-wizard/SearchingStep";
import { TripReadyStep } from "@/components/trip-wizard/TripReadyStep";
import { Airport } from "@/lib/airportSearch";
import { Traveler, TripResult, Itinerary, SavedTrip, AccommodationType } from "@/lib/tripTypes";
import { searchTrip } from "@/lib/tripSearch";
import { saveTrip, generateItinerary, subscribeToTripUpdates } from "@/lib/tripService";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { getUserDocument, SavedDocument } from "@/lib/travelerService";

type Step = "your-info" | "trip-details" | "travelers" | "searching" | "ready";

const stepNumbers: Record<Step, number> = {
  "your-info": 1,
  "trip-details": 2,
  travelers: 3,
  searching: 3,
  ready: 4,
};

const totalSteps = 4;

export default function CreateTrip() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>("your-info");
  
  // Trip state
  const [destination, setDestination] = useState<Airport | null>(null);
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [savedDocument, setSavedDocument] = useState<SavedDocument | null>(null);
  const [accommodationType, setAccommodationType] = useState<AccommodationType>("hotel");
  
  // New state for consolidated ready step
  const [tripId, setTripId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string>("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itineraryStatus, setItineraryStatus] = useState<SavedTrip["itinerary_status"]>("pending");
  const [expiresAt, setExpiresAt] = useState<string>("");
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

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

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Get organizer name from profile or default
  const organizerName = profile?.full_name || "Traveler";

  const handleYourInfoContinue = useCallback((document: SavedDocument | null) => {
    if (document) {
      setSavedDocument(document);
    }
    setStep("trip-details");
  }, []);

  const handleTripDetailsContinue = useCallback((data: { destination: Airport; origin: Airport; departureDate: Date; returnDate: Date }) => {
    setDestination(data.destination);
    setOrigin(data.origin);
    setDepartureDate(data.departureDate);
    setReturnDate(data.returnDate);
    setStep("travelers");
  }, []);

  const handleTravelersContinue = useCallback(async (travelersList: Traveler[], selectedAccommodationType: AccommodationType) => {
    setTravelers(travelersList);
    setAccommodationType(selectedAccommodationType);
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
      accommodationType: selectedAccommodationType,
    });

    if (result.success && result.data) {
      setTripResult(result.data);
      
      // Save trip immediately after search succeeds
      const saveResult = await saveTrip({
        organizerName,
        destinationCity: destination!.city,
        destinationCountry: destination!.country,
        destinationIata: destination!.iata,
        departureDate: format(departureDate!, "yyyy-MM-dd"),
        returnDate: format(returnDate!, "yyyy-MM-dd"),
        travelers: result.data.breakdown,
        flights: result.data.flights,
        accommodation: result.data.accommodation,
        costBreakdown: result.data.breakdown,
        totalPerPerson: result.data.total_per_person,
        tripTotal: result.data.trip_total,
      });

      if (saveResult.success && saveResult.tripId) {
        setTripId(saveResult.tripId);
        
        // Calculate 24-hour expiration
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        setExpiresAt(expiration.toISOString());
        
        // Fetch trip to get share code
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: tripData } = await supabase
          .from("trips")
          .select("share_code")
          .eq("id", saveResult.tripId)
          .single();
        
        if (tripData) {
          setShareCode((tripData as { share_code: string }).share_code);
        }
        
        // Start itinerary generation
        generateItinerary(
          saveResult.tripId,
          destination!.city,
          destination!.country,
          format(departureDate!, "yyyy-MM-dd"),
          format(returnDate!, "yyyy-MM-dd"),
          travelersList.length,
          result.data.accommodation?.name
        );
        
        // Subscribe to realtime updates
        const unsubscribe = await subscribeToTripUpdates(saveResult.tripId, (updatedTrip) => {
          setItinerary(updatedTrip.itinerary);
          setItineraryStatus(updatedTrip.itinerary_status);
        });
        unsubscribeRef.current = unsubscribe;
        
        // Move to ready step
        setStep("ready");
      } else {
        toast({
          title: "Failed to save trip",
          description: saveResult.error || "Please try again",
          variant: "destructive",
        });
        setStep("travelers");
      }
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
    // Cleanup subscription when going back to edit
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setStep("trip-details");
    setTripResult(null);
    setTripId(null);
    setShareCode("");
    setItinerary(null);
    setItineraryStatus("pending");
    setExpiresAt("");
  }, []);

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
          {step === "your-info" && (
            <motion.div
              key="your-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <YourInfoStep
                userId={user?.id}
                savedDocument={savedDocument}
                onContinue={handleYourInfoContinue}
              />
            </motion.div>
          )}

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
                organizerId={user?.id}
                organizerAvatarUrl={profile?.avatar_url || undefined}
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

          {step === "ready" && tripResult && destination && departureDate && returnDate && tripId && (
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TripReadyStep
                tripId={tripId}
                tripResult={tripResult}
                destination={destination}
                origin={origin}
                departureDate={departureDate}
                returnDate={returnDate}
                travelers={travelers}
                itinerary={itinerary}
                itineraryStatus={itineraryStatus}
                shareCode={shareCode}
                expiresAt={expiresAt}
                accommodationType={accommodationType}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
