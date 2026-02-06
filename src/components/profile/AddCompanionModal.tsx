import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TravelerForm } from "@/components/id-scan/TravelerForm";
import { extractTravelerInfo, TravelerInfo } from "@/lib/idExtraction";
import { saveCompanion, travelerInfoToCompanion } from "@/lib/travelerService";
import { AirportAutocomplete } from "@/components/trip-wizard/AirportAutocomplete";
import { Airport } from "@/lib/airportSearch";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, ScanLine, Edit3, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "choose" | "scan" | "processing" | "review" | "manual";

interface AddCompanionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const emptyTravelerInfo: TravelerInfo = {
  document_type: "passport",
  confidence: "high",
  full_legal_name: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  document_number: "",
  expiration_date: "",
};

export function AddCompanionModal({ open, onOpenChange, onSuccess }: AddCompanionModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [travelerInfo, setTravelerInfo] = useState<TravelerInfo>(emptyTravelerInfo);
  const [nickname, setNickname] = useState("");
  const [homeAirport, setHomeAirport] = useState<Airport | null>(null);
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setStep("choose");
    setTravelerInfo(emptyTravelerInfo);
    setNickname("");
    setHomeAirport(null);
    setSaving(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 300);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setStep("processing");
    const result = await extractTravelerInfo(file);
    if (result.success && result.data) {
      setTravelerInfo(result.data);
      setNickname(result.data.first_name || "");
      setStep("review");
    } else {
      toast.error(result.error || "Failed to extract information");
      setStep("scan");
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save companions");
      return;
    }

    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    setSaving(true);
    const companionInput = {
      ...travelerInfoToCompanion(travelerInfo, nickname.trim()),
      home_airport_iata: homeAirport?.iata,
      home_airport_name: homeAirport?.name,
      home_airport_city: homeAirport?.city,
    };

    const result = await saveCompanion(user.id, companionInput);
    setSaving(false);

    if (result.success) {
      toast.success("Companion saved");
      onSuccess();
      handleClose();
    } else {
      toast.error(result.error || "Failed to save companion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "choose" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={() => setStep("choose")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {step === "choose" && "Add Companion"}
            {step === "scan" && "Scan ID"}
            {step === "processing" && "Processing..."}
            {step === "review" && "Review Details"}
            {step === "manual" && "Enter Details"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <p className="text-sm text-muted-foreground text-center">
                How would you like to add this companion?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("scan")}
                  className="h-auto py-6 flex flex-col gap-2 rounded-xl"
                >
                  <ScanLine className="w-6 h-6" />
                  <span>Scan ID</span>
                  <span className="text-xs text-muted-foreground">Auto-extract info</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("manual")}
                  className="h-auto py-6 flex flex-col gap-2 rounded-xl"
                >
                  <Edit3 className="w-6 h-6" />
                  <span>Manual Entry</span>
                  <span className="text-xs text-muted-foreground">Type details</span>
                </Button>
              </div>
            </motion.div>
          )}

          {step === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-4 space-y-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full p-6 rounded-2xl border border-border bg-card",
                  "flex items-center gap-4 text-left transition-all",
                  "hover:border-primary/30 hover:shadow-soft"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Upload Photo</h3>
                  <p className="text-sm text-muted-foreground">Select from your device</p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-12 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full mb-4"
              />
              <p className="text-muted-foreground">Extracting information...</p>
            </motion.div>
          )}

          {(step === "review" || step === "manual") && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              {/* Nickname */}
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Mom, Best Friend Jake"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to identify this traveler
                </p>
              </div>

              {/* Traveler Info Form */}
              <TravelerForm data={travelerInfo} onChange={setTravelerInfo} />

              {/* Home Airport */}
              <div className="space-y-2">
                <Label>Home Airport (optional)</Label>
                <AirportAutocomplete
                  value={homeAirport}
                  onChange={setHomeAirport}
                  placeholder="Their usual departure airport"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving || !nickname.trim()}
                className="w-full h-12 rounded-xl"
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-background border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Companion
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
