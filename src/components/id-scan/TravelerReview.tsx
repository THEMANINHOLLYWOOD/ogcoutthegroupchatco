import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TravelerForm } from "./TravelerForm";
import { TravelerInfo } from "@/lib/idExtraction";
import { ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TravelerReviewProps {
  data: TravelerInfo;
  imagePreview?: string;
  onConfirm: (data: TravelerInfo) => void;
  onRetake: () => void;
  onChange: (data: TravelerInfo) => void;
}

const confidenceColors = {
  high: "bg-green-500/10 text-green-700 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  low: "bg-red-500/10 text-red-700 border-red-500/20",
};

const confidenceLabels = {
  high: "High confidence",
  medium: "Medium confidence - please review",
  low: "Low confidence - please verify all fields",
};

export function TravelerReview({
  data,
  imagePreview,
  onConfirm,
  onRetake,
  onChange,
}: TravelerReviewProps) {
  const handleConfirm = () => {
    // Validate required fields
    const requiredFields: (keyof TravelerInfo)[] = [
      "first_name",
      "last_name",
      "full_legal_name",
      "date_of_birth",
      "document_number",
      "expiration_date",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      // Could show a toast here, but for now just don't proceed
      return;
    }

    onConfirm(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review Your Information
        </h2>
        <p className="text-muted-foreground">
          Please verify the extracted details are correct
        </p>
      </div>

      {/* Confidence Badge */}
      <div className="flex justify-center mb-6">
        <Badge
          variant="outline"
          className={confidenceColors[data.confidence]}
        >
          {confidenceLabels[data.confidence]}
        </Badge>
      </div>

      {/* Document Preview (optional) */}
      {imagePreview && (
        <div className="mb-6">
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
            <img
              src={imagePreview}
              alt="Uploaded document"
              className="w-full h-32 object-cover opacity-50 blur-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
                Document uploaded
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft mb-6">
        <TravelerForm data={data} onChange={onChange} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onRetake}
          className="flex-1 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retake Photo
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1 gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirm & Continue
        </Button>
      </div>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        Your document image is processed securely and not stored. Only the extracted text is saved.
      </p>
    </motion.div>
  );
}
