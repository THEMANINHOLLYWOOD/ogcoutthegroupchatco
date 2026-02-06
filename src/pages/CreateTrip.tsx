import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IDUploadCard } from "@/components/id-scan/IDUploadCard";
import { IDProcessing } from "@/components/id-scan/IDProcessing";
import { TravelerReview } from "@/components/id-scan/TravelerReview";
import { extractTravelerInfo, TravelerInfo } from "@/lib/idExtraction";
import { toast } from "@/hooks/use-toast";

type Step = "upload" | "processing" | "review";
type ProcessingStatus = "scanning" | "extracting" | "complete";

export default function CreateTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("scanning");
  const [travelerInfo, setTravelerInfo] = useState<TravelerInfo | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start processing
    setStep("processing");
    setProcessingStatus("scanning");

    // Simulate scanning phase
    await new Promise((r) => setTimeout(r, 1000));
    setProcessingStatus("extracting");

    // Call extraction API
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
      // Reset input so same file can be selected again
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

  const handleConfirm = useCallback((data: TravelerInfo) => {
    // For now, just show a success message
    // In the future, this will navigate to the next step
    toast({
      title: "Profile Created",
      description: `Welcome, ${data.first_name}! Let's plan your trip.`,
    });
    // TODO: Navigate to trip details step
    // navigate("/create-trip/details");
  }, []);

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
            Step 1 of 3
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
              {/* Hero */}
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Let's get you trip-ready
                </h1>
                <p className="text-muted-foreground text-lg">
                  Upload your ID or passport to auto-fill your traveler profile
                </p>
              </div>

              {/* Upload Cards */}
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

                {/* Hidden file inputs */}
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

              {/* Drag & Drop Zone */}
              <div
                className="hidden lg:flex border-2 border-dashed border-border rounded-2xl p-8 items-center justify-center text-muted-foreground text-sm mb-8 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Or drag and drop an image here
              </div>

              {/* Privacy Assurance */}
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
                      Your document is processed securely and never stored. We only save the extracted text needed for booking.
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
                      All data is encrypted in transit and at rest using bank-level security.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Entry Option */}
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
                onConfirm={handleConfirm}
                onRetake={handleRetake}
                onChange={setTravelerInfo}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
