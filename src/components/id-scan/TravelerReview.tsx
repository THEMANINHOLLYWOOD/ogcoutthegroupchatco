import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TravelerForm } from "./TravelerForm";
import { TravelerInfo } from "@/lib/idExtraction";
import { CheckCircle2, RefreshCw, UserPlus, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { saveUserDocument, saveCompanion, travelerInfoToCompanion } from "@/lib/travelerService";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [saveAsCompanion, setSaveAsCompanion] = useState(false);
  const [companionNickname, setCompanionNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
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
      toast.error("Please fill in all required fields");
      return;
    }

    // Handle saving if user is authenticated
    if (user && (saveToProfile || saveAsCompanion)) {
      setSaving(true);
      
      if (saveToProfile) {
        const result = await saveUserDocument(user.id, data);
        if (!result.success) {
          toast.error("Failed to save to profile");
          setSaving(false);
          return;
        }
        toast.success("Saved to your profile");
      }

      if (saveAsCompanion && companionNickname.trim()) {
        const companionInput = travelerInfoToCompanion(data, companionNickname.trim());
        const result = await saveCompanion(user.id, companionInput);
        if (!result.success) {
          toast.error("Failed to save companion");
          setSaving(false);
          return;
        }
        toast.success("Companion saved");
      }

      setSaving(false);
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

      {/* Save Options (for authenticated users) */}
      {user && (
        <div className="space-y-3 mb-6">
          {/* Save to Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-medium text-foreground text-sm">Save to My Profile</span>
                <p className="text-xs text-muted-foreground">Auto-fill on future trips</p>
              </div>
            </div>
            <Switch 
              checked={saveToProfile} 
              onCheckedChange={(checked) => {
                setSaveToProfile(checked);
                if (checked) setSaveAsCompanion(false);
              }} 
            />
          </motion.div>

          {/* Save as Companion */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-medium text-foreground text-sm">Save as Travel Companion</span>
                <p className="text-xs text-muted-foreground">Add to your contacts</p>
              </div>
            </div>
            <Switch 
              checked={saveAsCompanion} 
              onCheckedChange={(checked) => {
                setSaveAsCompanion(checked);
                if (checked) setSaveToProfile(false);
              }} 
            />
          </motion.div>

          {/* Nickname input for companion */}
          <AnimatePresence>
            {saveAsCompanion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Input
                  value={companionNickname}
                  onChange={(e) => setCompanionNickname(e.target.value)}
                  placeholder="Nickname (e.g., Mom, Jake)"
                  className="h-11 rounded-xl"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onRetake}
          className="flex-1 gap-2"
          disabled={saving}
        >
          <RefreshCw className="w-4 h-4" />
          Retake Photo
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1 gap-2"
          disabled={saving || (saveAsCompanion && !companionNickname.trim())}
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
            />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Continue
            </>
          )}
        </Button>
      </div>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        Your document image is processed securely and not stored. Only the extracted text is saved.
      </p>
    </motion.div>
  );
}
