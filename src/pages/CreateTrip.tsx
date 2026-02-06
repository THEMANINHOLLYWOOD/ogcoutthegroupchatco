import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { IDUploadCard } from "@/components/id-scan/IDUploadCard";
import { IDProcessing } from "@/components/id-scan/IDProcessing";
import { TravelerReview } from "@/components/id-scan/TravelerReview";
import { TripDetailsStep } from "@/components/trip-wizard/TripDetailsStep";
import { AddTravelersStep } from "@/components/trip-wizard/AddTravelersStep";
import { SearchingStep } from "@/components/trip-wizard/SearchingStep";
import { TripSummaryStep } from "@/components/trip-wizard/TripSummaryStep";
import { extractTravelerInfo, TravelerInfo } from "@/lib/idExtraction";
import { Airport } from "@/lib/airportSearch";
import { Traveler, TripResult } from "@/lib/tripTypes";
import { searchTrip } from "@/lib/tripSearch";
import { toast } from "@/hooks/use-toast";

type Step = "upload" | "processing" | "review" | "trip-details" | "travelers" | "searching" | "summary";
type ProcessingStatus = "scanning" | "extracting" | "complete";

const stepNumbers: Record<Step, number> = {
  upload: 1,
  processing: 1,
  review: 1,
  "trip-details": 2,
  travelers: 3,
  searching: 3,
  summary: 4,
};

const totalSteps = 4;

export default function CreateTrip() {
  const [step, setStep] = useState<Step>("upload");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("scanning");
  const [travelerInfo, setTravelerInfo] = useState<TravelerInfo | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  
  // Trip state
  const [destination, setDestination] = useState<Airport | null>(null);
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setStep("processing");
    setProcessingStatus("scanning");

    await new Promise((r) => setTimeout(r, 1000));
    setProcessingStatus("extracting");

    const result = await extractTravelerInfo(file);

    if (result.success && result.data) {
      setProcessingStatus("complete");
      await new Promise((r) => setTimeout(r, 800));
      setTravelerInfo(result.data);
      setStep("review");
    } else {
      toast({
        title: "Extraction Failed",
        description: result.error || "Could not extract information from the image",
        variant: "destructive",
      });
      setStep("upload");
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRetake = useCallback(() => {
    setStep("upload");
    setTravelerInfo(null);
    setImagePreview(undefined);
  }, []);

  const handleConfirmProfile = useCallback((data: TravelerInfo) => {
    setTravelerInfo(data);
    setStep("trip-details");
  }, []);

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

    // Call the search API
    const result = await searchTrip({
      organizer: travelerInfo!,
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
  }, [travelerInfo, destination, origin, departureDate, returnDate]);

  const handleEditTrip = useCallback(() => {
    setStep("trip-details");
    setTripResult(null);
  }, []);

  const handleShareTrip = useCallback(() => {
    toast({
      title: "Coming Soon",
      description: "Trip sharing will be available soon!",
    });
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
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Let's get you trip-ready
                </h1>
                <p className="text-muted-foreground text-lg">
                  Upload your ID or passport to auto-fill your traveler profile
                </p>
              </div>

              <div
                className="space-y-3 mb-6"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <IDUploadCard
                  icon="camera"
                  title="Take a Photo"
                  subtitle="Use your camera to capture your ID"
                  onClick={() => cameraInputRef.current?.click()}
                />
                <IDUploadCard
                  icon="upload"
                  title="Upload from Device"
                  subtitle="Select an existing photo"
                  onClick={() => fileInputRef.current?.click()}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/heif"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>

              <div
                className="hidden lg:flex border-2 border-dashed border-border rounded-2xl p-8 items-center justify-center text-muted-foreground text-sm mb-8 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Or drag and drop an image here
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      Your privacy matters
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your document is processed securely and never stored.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      End-to-end encrypted
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      All data is encrypted using bank-level security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                  onClick={() => {
                    setTravelerInfo({
                      document_type: "passport",
                      confidence: "high",
                    });
                    setStep("review");
                  }}
                >
                  Or enter information manually
                </button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto"
            >
              <IDProcessing status={processingStatus} />
            </motion.div>
          )}

          {step === "review" && travelerInfo && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TravelerReview
                data={travelerInfo}
                imagePreview={imagePreview}
                onConfirm={handleConfirmProfile}
                onRetake={handleRetake}
                onChange={setTravelerInfo}
              />
            </motion.div>
          )}

          {step === "trip-details" && travelerInfo && (
            <motion.div
              key="trip-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TripDetailsStep
                organizerName={`${travelerInfo.first_name || ""} ${travelerInfo.last_name || ""}`.trim() || "Traveler"}
                onContinue={handleTripDetailsContinue}
              />
            </motion.div>
          )}

          {step === "travelers" && travelerInfo && origin && destination && (
            <motion.div
              key="travelers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AddTravelersStep
                organizer={travelerInfo}
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
