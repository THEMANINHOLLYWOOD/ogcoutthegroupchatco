import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Check, Share, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonProps {
  tripId: string;
  shareCode: string;
}

export function ShareButton({ tripId, shareCode }: ShareButtonProps) {
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

  return (
    <div className="space-y-3">
      {/* Share Code Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-muted/50 rounded-xl p-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Trip Code:</span>
          <span className="font-mono text-lg font-bold tracking-wider text-foreground">
            {shareCode}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCode}
          className="h-8 px-2"
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="flex-1 h-12 rounded-xl"
        >
          <AnimatePresence mode="wait">
            {copiedLink ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-primary" />
                <span>Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                <span>Copy Link</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {typeof navigator.share === "function" && (
          <Button
            onClick={handleNativeShare}
            className="h-12 px-4 rounded-xl"
          >
            <Share className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
