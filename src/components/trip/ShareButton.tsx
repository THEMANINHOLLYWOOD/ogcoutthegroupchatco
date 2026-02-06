import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Check, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonProps {
  tripId: string;
}

export function ShareButton({ tripId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/trip/${tripId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your travel group",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out our trip!",
          text: "Join us on this amazing adventure",
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleCopy}
        variant="outline"
        className="flex-1 h-12 rounded-xl"
      >
        <AnimatePresence mode="wait">
          {copied ? (
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
  );
}
