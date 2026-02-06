import { supabase } from "@/integrations/supabase/client";

export interface TravelerInfo {
  document_type: "passport" | "drivers_license" | "national_id" | "unknown";
  full_legal_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: "M" | "F" | "X" | "unknown";
  nationality?: string;
  document_number?: string;
  expiration_date?: string;
  issue_date?: string;
  place_of_birth?: string;
  issuing_country?: string;
  confidence: "high" | "medium" | "low";
  issues?: string[];
}

export interface ExtractionResult {
  success: boolean;
  data?: TravelerInfo;
  error?: string;
}

/**
 * Compress image to reduce file size before sending to API
 */
async function compressImage(file: File, maxSizeMB: number = 4): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until we're under the size limit
        let quality = 0.9;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        
        while (base64.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }
        
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract traveler information from an ID or passport image
 */
export async function extractTravelerInfo(file: File): Promise<ExtractionResult> {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/heic", "image/heif"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: "Please upload a JPEG, PNG, or HEIC image",
      };
    }

    // Compress and convert to base64
    const base64Image = await compressImage(file);

    // Call the edge function
    const { data, error } = await supabase.functions.invoke("extract-id", {
      body: { image: base64Image },
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        success: false,
        error: error.message || "Failed to process image",
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    if (!data?.travelerInfo) {
      return {
        success: false,
        error: "Could not extract information from the image",
      };
    }

    return {
      success: true,
      data: data.travelerInfo,
    };
  } catch (err) {
    console.error("Extraction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
