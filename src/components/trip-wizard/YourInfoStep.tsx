import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IDUploadCard } from "@/components/id-scan/IDUploadCard";
import { IDProcessing } from "@/components/id-scan/IDProcessing";
import { TravelerForm } from "@/components/id-scan/TravelerForm";
import { SavedDocument, saveUserDocument } from "@/lib/travelerService";
import { extractTravelerInfo, TravelerInfo } from "@/lib/idExtraction";
import { toast } from "sonner";
import { format } from "date-fns";

type StepState = "idle" | "processing" | "review" | "saving";

interface YourInfoStepProps {
  userId?: string;
  savedDocument: SavedDocument | null;
  onContinue: (document: SavedDocument | null) => void;
}

export function YourInfoStep({
  userId,
  savedDocument,
  onContinue,
}: YourInfoStepProps) {
  const [state, setState] = useState<StepState>("idle");
  const [extractedData, setExtractedData] = useState<TravelerInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setState("processing");
    
    const result = await extractTravelerInfo(file);
    
    if (result.success && result.data) {
      setExtractedData(result.data);
      setState("review");
    } else {
      toast.error(result.error || "Failed to extract information");
      setState("idle");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    e.target.value = "";
  };

  const handleUseSavedInfo = () => {
    onContinue(savedDocument);
  };

  const handleSkip = () => {
    onContinue(null);
  };

  const handleRetake = () => {
    setExtractedData(null);
    setState("idle");
  };

  const handleConfirmExtracted = async () => {
    if (!extractedData || !userId) {
      onContinue(null);
      return;
    }

    setState("saving");
    
    const result = await saveUserDocument(userId, extractedData);
    
    if (result.success) {
      toast.success("Travel info saved!");
      // Create a SavedDocument-like object to pass forward
      const newDoc: SavedDocument = {
        id: "",
        user_id: userId,
        document_type: extractedData.document_type || "passport",
        full_legal_name: extractedData.full_legal_name || "",
        first_name: extractedData.first_name || "",
        middle_name: extractedData.middle_name,
        last_name: extractedData.last_name || "",
        date_of_birth: extractedData.date_of_birth || "",
        gender: extractedData.gender,
        nationality: extractedData.nationality,
        document_number: extractedData.document_number || "",
        expiration_date: extractedData.expiration_date || "",
        issue_date: extractedData.issue_date,
        place_of_birth: extractedData.place_of_birth,
        issuing_country: extractedData.issuing_country,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onContinue(newDoc);
    } else {
      toast.error(result.error || "Failed to save");
      setState("review");
    }
  };

  const handleDataChange = (newData: TravelerInfo) => {
    setExtractedData(newData);
  };

  // Format expiration date for display
  const formatExpDate = (date: string) => {
    try {
      return format(new Date(date), "MMM yyyy");
    } catch {
      return date;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Your Travel Info
              </h1>
              <p className="text-muted-foreground">
                Let's set you up for seamless booking
              </p>
            </div>

            <div className="space-y-3">
              {/* Saved Document Card */}
              {savedDocument && userId && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUseSavedInfo}
                    className="w-full p-5 rounded-2xl border border-primary/30 bg-primary/5 flex items-center gap-4 text-left transition-all hover:border-primary/50 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        Use saved passport info
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {savedDocument.full_legal_name} • Exp: {formatExpDate(savedDocument.expiration_date)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  </motion.button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or scan new
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Scan ID Card */}
              <IDUploadCard
                icon="camera"
                title="Scan ID or Passport"
                subtitle="Quick AI-powered extraction"
                onClick={handleCameraClick}
              />

              {/* Upload Card */}
              <IDUploadCard
                icon="upload"
                title="Upload ID photo"
                subtitle="From your photo library"
                onClick={handleUploadClick}
              />
            </div>

            {/* Skip Link */}
            <div className="pt-4 text-center">
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>
        )}

        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <IDProcessing />
          </motion.div>
        )}

        {state === "review" && extractedData && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Review Your Info
              </h2>
              <p className="text-muted-foreground">
                Verify the extracted details are correct
              </p>
            </div>

            {/* Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <TravelerForm data={extractedData} onChange={handleDataChange} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirmExtracted}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {state === "saving" && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
            />
            <p className="mt-4 text-muted-foreground">Saving your info...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
