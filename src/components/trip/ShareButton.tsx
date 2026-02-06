import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Check, Share, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ShareButtonProps {
  tripId: string;
  shareCode: string;
  isClaimed?: boolean;
}

export function ShareButton({ tripId, shareCode, isClaimed = false }: ShareButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareUrl = `${window.location.origin}/trip/${tripId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your travel group",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      toast({
        title: "Code copied!",
        description: `Share code ${shareCode} with your friends`,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out our trip!",
          text: `Join us on this amazing adventure! Use code: ${shareCode}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCreateLink = () => {
    if (!user) {
      // Redirect to auth, then back to claim
      navigate(`/auth?redirect=/trip/${tripId}/claim`);
    } else {
      // Go directly to claim
      navigate(`/trip/${tripId}/claim`);
    }
  };

  // If not claimed yet, show "Create Link" CTA
  if (!isClaimed) {
    return (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Button
            onClick={handleCreateLink}
            className="w-full h-12 sm:h-14 rounded-xl text-base sm:text-lg font-semibold"
            size="lg"
          >
            Create Link
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {user ? "Save this trip to your profile" : "Sign up to share this trip with friends"}
          </p>
        </motion.div>
      </div>
    );
  }

  // Already claimed - show share options (simplified)
  return (
    <div className="space-y-3">
      {/* Share Code Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-muted/50 rounded-xl p-3"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Trip Code:</span>
          <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-foreground truncate">
            {shareCode}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCode}
          className="h-9 w-9 sm:h-8 sm:w-auto sm:px-2 shrink-0"
        >
          <AnimatePresence mode="wait">
            {copiedCode ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Single Share Button */}
      <Button
        onClick={handleNativeShare}
        className="w-full h-11 sm:h-12 rounded-xl"
      >
        <Share className="w-4 h-4 mr-2" />
        Share with Friends
      </Button>
    </div>
  );
}
