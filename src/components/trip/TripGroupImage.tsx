import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Traveler } from "@/lib/tripTypes";

interface TripGroupImageProps {
  tripId: string;
  destinationCity: string;
  destinationCountry: string;
  travelers: Traveler[];
  onImageReady?: (imageUrl: string) => void;
}

export function TripGroupImage({
  tripId,
  destinationCity,
  destinationCountry,
  travelers,
  onImageReady,
}: TripGroupImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function generateImage() {
      try {
        // First check if we already have a cached group image
        const groupPath = `share-images/${tripId}/group.png`;
        const { data: existingFiles } = await supabase.storage
          .from("travel-media")
          .list(`share-images/${tripId}`, { search: "group.png" });

        if (existingFiles && existingFiles.length > 0) {
          const { data: urlData } = supabase.storage
            .from("travel-media")
            .getPublicUrl(groupPath);
          
          if (isMounted) {
            setImageUrl(urlData.publicUrl);
            setIsLoading(false);
            onImageReady?.(urlData.publicUrl);
          }
          return;
        }

        // Build traveler data with avatar URLs
        const travelerData = travelers.map(t => ({
          name: t.name,
          avatar_url: t.avatar_url || null,
        }));

        // Call edge function to generate group image
        const { data, error } = await supabase.functions.invoke("generate-share-image", {
          body: {
            tripId,
            destinationCity,
            destinationCountry,
            travelers: travelerData,
            type: "group",
          },
        });

        if (error) {
          console.error("Error generating group image:", error);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }

        const result = data as { success: boolean; imageUrl?: string; error?: string };
        
        if (result.success && result.imageUrl && isMounted) {
          setImageUrl(result.imageUrl);
          setIsLoading(false);
          onImageReady?.(result.imageUrl);
        } else if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Exception generating group image:", err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    generateImage();

    return () => {
      isMounted = false;
    };
  }, [tripId, destinationCity, destinationCountry, travelers, onImageReady]);

  // Don't render anything if there was an error
  if (hasError) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-muted/30"
    >
      <div className="aspect-video w-full">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Skeleton className="h-full w-full rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs">Creating your group photo...</span>
                </div>
              </div>
            </motion.div>
          ) : imageUrl ? (
            <motion.img
              key="image"
              src={imageUrl}
              alt={`${travelers.length} travelers in ${destinationCity}`}
              className="h-full w-full object-cover rounded-2xl"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
