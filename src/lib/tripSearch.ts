import { supabase } from "@/integrations/supabase/client";
import { TripSearch, TripResult } from "./tripTypes";
import { format } from "date-fns";

export interface SearchTripRequest {
  destination: {
    iata: string;
    city: string;
    country: string;
  };
  travelers: Array<{
    name: string;
    origin: {
      iata: string;
      city: string;
      country: string;
    };
    isOrganizer: boolean;
  }>;
  departureDate: string;
  returnDate: string;
  accommodationType?: "airbnb" | "hotel";
}

export async function searchTrip(tripSearch: TripSearch): Promise<{ success: boolean; data?: TripResult; error?: string }> {
  const request: SearchTripRequest = {
    destination: {
      iata: tripSearch.destination.iata,
      city: tripSearch.destination.city,
      country: tripSearch.destination.country,
    },
    travelers: tripSearch.travelers.map((t) => ({
      name: t.name,
      origin: {
        iata: t.origin.iata,
        city: t.origin.city,
        country: t.origin.country,
      },
      isOrganizer: t.isOrganizer,
    })),
    departureDate: format(tripSearch.departureDate, "yyyy-MM-dd"),
    returnDate: format(tripSearch.returnDate, "yyyy-MM-dd"),
    accommodationType: tripSearch.accommodationType || "hotel",
  };

  try {
    const { data, error } = await supabase.functions.invoke("search-trip", {
      body: request,
    });

    if (error) {
      console.error("Search trip error:", error);
      return { success: false, error: error.message };
    }

    if (data.error) {
      return { success: false, error: data.error };
    }

    return { success: true, data: data as TripResult };
  } catch (err) {
    console.error("Search trip exception:", err);
    return { success: false, error: "Failed to search for trips" };
  }
}
