import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Upload, Loader2, Check } from "lucide-react";
import { extractTravelerInfo, TravelerInfo } from "@/lib/idExtraction";
import { saveUserDocument, SavedDocument } from "@/lib/travelerService";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UpdateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentDocument: SavedDocument | null;
  onDocumentUpdated: (doc: SavedDocument) => void;
}

export function UpdateDocumentModal({
  open,
  onOpenChange,
  userId,
  currentDocument,
  onDocumentUpdated,
}: UpdateDocumentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<TravelerInfo | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setExtractedInfo(null);

    const result = await extractTravelerInfo(file);
    
    if (result.success && result.data) {
      setExtractedInfo(result.data);
    } else {
      toast({
        title: "Could not read document",
        description: result.error || "Please try a clearer photo",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
    e.target.value = "";
  }, []);

  const handleSave = async () => {
    if (!extractedInfo) return;
    
    setIsProcessing(true);
    const result = await saveUserDocument(userId, extractedInfo);
    
    if (result.success) {
      toast({ title: "Document updated" });
      // Create a mock SavedDocument to pass back
      const updatedDoc: SavedDocument = {
        id: currentDocument?.id || "",
        user_id: userId,
        document_type: extractedInfo.document_type,
        full_legal_name: extractedInfo.full_legal_name || "",
        first_name: extractedInfo.first_name || "",
        middle_name: extractedInfo.middle_name,
        last_name: extractedInfo.last_name || "",
        date_of_birth: extractedInfo.date_of_birth || "",
        gender: extractedInfo.gender,
        nationality: extractedInfo.nationality,
        document_number: extractedInfo.document_number || "",
        expiration_date: extractedInfo.expiration_date || "",
        issue_date: extractedInfo.issue_date,
        place_of_birth: extractedInfo.place_of_birth,
        issuing_country: extractedInfo.issuing_country,
        created_at: currentDocument?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onDocumentUpdated(updatedDoc);
      setExtractedInfo(null);
      onOpenChange(false);
    } else {
      toast({
        title: "Failed to save",
        description: result.error,
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  const formatDocType = (type: string) => {
    return type === "passport" ? "Passport" : 
           type === "drivers_license" ? "Driver's License" :
           type === "national_id" ? "National ID" : "Document";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Update Travel Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Document Info */}
          {currentDocument && !extractedInfo && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Current</div>
              <div className="font-medium">{currentDocument.full_legal_name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{formatDocType(currentDocument.document_type)}</span>
                <span>•</span>
                <span>Exp: {format(new Date(currentDocument.expiration_date), "MMM yyyy")}</span>
              </div>
            </div>
          )}

          {/* Extracted Preview */}
          {extractedInfo && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="text-xs text-primary uppercase tracking-wide flex items-center gap-1">
                <Check className="w-3 h-3" />
                New Document
              </div>
              <div className="font-medium">{extractedInfo.full_legal_name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>{formatDocType(extractedInfo.document_type)}</span>
                {extractedInfo.expiration_date && (
                  <>
                    <span>•</span>
                    <span>Exp: {format(new Date(extractedInfo.expiration_date), "MMM yyyy")}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Upload Area */}
          <label className="block">
            <div className="relative border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {extractedInfo ? "Upload different document" : "Upload passport or ID photo"}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
            </div>
          </label>

          {/* Actions */}
          {extractedInfo && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setExtractedInfo(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
