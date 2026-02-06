import { supabase } from "@/integrations/supabase/client";
import { SavedTrip, SaveTripInput, Itinerary, TravelerCost, FlightOption, AccommodationOption, Activity } from "./tripTypes";

export interface FindAlternativeParams {
  tripId: string;
  dayNumber: number;
  activityIndex: number;
  currentActivity: Activity;
  priceDirection: 'cheaper' | 'pricier';
  destinationCity: string;
  destinationCountry: string;
  date: string;
}

export async function saveTrip(input: SaveTripInput): Promise<{ success: boolean; tripId?: string; error?: string }> {
  try {
    // Use type assertion to bypass strict typing since the types file may not be updated yet
    const insertData = {
      organizer_name: input.organizerName,
      destination_city: input.destinationCity,
      destination_country: input.destinationCountry,
      destination_iata: input.destinationIata,
      departure_date: input.departureDate,
      return_date: input.returnDate,
      travelers: input.travelers,
      flights: input.flights,
      accommodation: input.accommodation,
      cost_breakdown: input.costBreakdown,
      total_per_person: input.totalPerPerson,
      trip_total: input.tripTotal,
      itinerary_status: "pending",
    };

    const { data, error } = await supabase
      .from("trips")
      .insert(insertData as never)
      .select("id")
      .single();

    if (error) {
      console.error("Error saving trip:", error);
      return { success: false, error: error.message };
    }

    return { success: true, tripId: (data as { id: string }).id };
  } catch (err) {
    console.error("Exception saving trip:", err);
    return { success: false, error: "Failed to save trip" };
  }
}

export async function fetchTrip(tripId: string): Promise<{ success: boolean; trip?: SavedTrip; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error) {
      console.error("Error fetching trip:", error);
      return { success: false, error: error.message };
    }

    // Cast data to unknown first to bypass strict typing
    const rawData = data as unknown as Record<string, unknown>;
    
    const trip: SavedTrip = {
      id: rawData.id as string,
      organizer_id: rawData.organizer_id as string | null,
      organizer_name: rawData.organizer_name as string,
      destination_city: rawData.destination_city as string,
      destination_country: rawData.destination_country as string,
      destination_iata: rawData.destination_iata as string,
      departure_date: rawData.departure_date as string,
      return_date: rawData.return_date as string,
      travelers: rawData.travelers as TravelerCost[],
      flights: rawData.flights as FlightOption[],
      accommodation: rawData.accommodation as AccommodationOption | null,
      cost_breakdown: rawData.cost_breakdown as TravelerCost[],
      total_per_person: Number(rawData.total_per_person),
      trip_total: Number(rawData.trip_total),
      itinerary: rawData.itinerary as Itinerary | null,
      itinerary_status: rawData.itinerary_status as SavedTrip["itinerary_status"],
      share_code: rawData.share_code as string,
      share_image_url: rawData.share_image_url as string | null,
      link_created_at: rawData.link_created_at as string | null,
      link_expires_at: rawData.link_expires_at as string | null,
      created_at: rawData.created_at as string,
      updated_at: rawData.updated_at as string,
    };

    return { success: true, trip };
  } catch (err) {
    console.error("Exception fetching trip:", err);
    return { success: false, error: "Failed to fetch trip" };
  }
}

export async function fetchTripByCode(code: string): Promise<{ success: boolean; tripId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("id")
      .eq("share_code", code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("Error fetching trip by code:", error);
      return { success: false, error: "Failed to lookup trip" };
    }

    if (!data) {
      return { success: false, error: "Trip not found. Check the code and try again." };
    }

    return { success: true, tripId: (data as { id: string }).id };
  } catch (err) {
    console.error("Exception fetching trip by code:", err);
    return { success: false, error: "Failed to lookup trip" };
  }
}

export async function generateItinerary(
  tripId: string,
  destinationCity: string,
  destinationCountry: string,
  departureDate: string,
  returnDate: string,
  travelerCount: number,
  accommodationName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await supabase.functions.invoke("generate-itinerary", {
      body: {
        tripId,
        destinationCity,
        destinationCountry,
        departureDate,
        returnDate,
        travelerCount,
        accommodationName,
      },
    });

    if (response.error) {
      console.error("Error generating itinerary:", response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception generating itinerary:", err);
    return { success: false, error: "Failed to generate itinerary" };
  }
}

export async function subscribeToTripUpdates(
  tripId: string,
  onUpdate: (trip: SavedTrip) => void
): Promise<() => void> {
  const channel = supabase
    .channel(`trip-${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "trips",
        filter: `id=eq.${tripId}`,
      },
      (payload) => {
        const data = payload.new as Record<string, unknown>;
        const trip: SavedTrip = {
          id: data.id as string,
          organizer_id: data.organizer_id as string | null,
          organizer_name: data.organizer_name as string,
          destination_city: data.destination_city as string,
          destination_country: data.destination_country as string,
          destination_iata: data.destination_iata as string,
          departure_date: data.departure_date as string,
          return_date: data.return_date as string,
          travelers: (data.travelers as unknown) as TravelerCost[],
          flights: (data.flights as unknown) as FlightOption[],
          accommodation: (data.accommodation as unknown) as AccommodationOption | null,
          cost_breakdown: (data.cost_breakdown as unknown) as TravelerCost[],
          total_per_person: Number(data.total_per_person),
          trip_total: Number(data.trip_total),
          itinerary: (data.itinerary as unknown) as Itinerary | null,
          itinerary_status: data.itinerary_status as SavedTrip["itinerary_status"],
          share_code: data.share_code as string,
          share_image_url: data.share_image_url as string | null,
          link_created_at: data.link_created_at as string | null,
          link_expires_at: data.link_expires_at as string | null,
          created_at: data.created_at as string,
          updated_at: data.updated_at as string,
        };
        onUpdate(trip);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function findAlternativeActivity(
  params: FindAlternativeParams
): Promise<{ success: boolean; activity?: Activity; error?: string }> {
  try {
    const response = await supabase.functions.invoke("find-alternative-activity", {
      body: params,
    });

    if (response.error) {
      console.error("Error finding alternative:", response.error);
      return { success: false, error: response.error.message };
    }

    const data = response.data as { success: boolean; activity?: Activity; error?: string };
    
    if (!data.success || !data.activity) {
      return { success: false, error: data.error || "No alternative found" };
    }

    return { success: true, activity: data.activity };
  } catch (err) {
    console.error("Exception finding alternative:", err);
    return { success: false, error: "Failed to find alternative" };
  }
}

export function calculateItineraryCost(itinerary: Itinerary | null): number {
  if (!itinerary?.days) return 0;
  
  return itinerary.days.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + (activity.estimated_cost || 0);
    }, 0);
  }, 0);
}

export function calculateDayCost(activities: Activity[]): number {
  return activities.reduce((total, activity) => {
    return total + (activity.estimated_cost || 0);
  }, 0);
}

export function calculateSelectedActivitiesCost(
  itinerary: Itinerary | null,
  selectedActivities: Set<string>
): number {
  if (!itinerary?.days) return 0;
  
  let total = 0;
  itinerary.days.forEach(day => {
    day.activities.forEach((activity, index) => {
      const key = `${day.day_number}-${index}`;
      if (selectedActivities.has(key)) {
        total += activity.estimated_cost || 0;
      }
    });
  });
  
  return total;
}

export function getTotalAvailableActivitiesCost(itinerary: Itinerary | null): number {
  if (!itinerary?.days) return 0;
}

export async function addActivityToItinerary(
  tripId: string,
  dayNumber: number,
  activity: Activity
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch current itinerary
    const { data, error: fetchError } = await supabase
      .from("trips")
      .select("itinerary")
      .eq("id", tripId)
      .single();

    if (fetchError || !data) {
      return { success: false, error: "Failed to fetch trip" };
    }

    const itinerary = (data.itinerary as unknown) as Itinerary | null;
    if (!itinerary?.days) {
      return { success: false, error: "No itinerary exists" };
    }

    // Find the day and add the activity
    const dayIndex = itinerary.days.findIndex(d => d.day_number === dayNumber);
    if (dayIndex === -1) {
      return { success: false, error: "Day not found" };
    }

    itinerary.days[dayIndex].activities.push(activity);

    // Update the trip
    const { error: updateError } = await supabase
      .from("trips")
      .update({ itinerary: itinerary as unknown as never })
      .eq("id", tripId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error adding activity:", err);
    return { success: false, error: "Failed to add activity" };
  }
}

export async function removeActivityFromItinerary(
  tripId: string,
  dayNumber: number,
  activityIndex: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch current itinerary
    const { data, error: fetchError } = await supabase
      .from("trips")
      .select("itinerary")
      .eq("id", tripId)
      .single();

    if (fetchError || !data) {
      return { success: false, error: "Failed to fetch trip" };
    }

    const itinerary = (data.itinerary as unknown) as Itinerary | null;
    if (!itinerary?.days) {
      return { success: false, error: "No itinerary exists" };
    }

    // Find the day
    const dayIndex = itinerary.days.findIndex(d => d.day_number === dayNumber);
    if (dayIndex === -1) {
      return { success: false, error: "Day not found" };
    }

    // Remove the activity
    if (activityIndex < 0 || activityIndex >= itinerary.days[dayIndex].activities.length) {
      return { success: false, error: "Activity not found" };
    }

    itinerary.days[dayIndex].activities.splice(activityIndex, 1);

    // Update the trip
    const { error: updateError } = await supabase
      .from("trips")
      .update({ itinerary: itinerary as unknown as never })
      .eq("id", tripId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error removing activity:", err);
    return { success: false, error: "Failed to remove activity" };
  }
}

export async function claimTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "You must be logged in to claim a trip" };
    }

    // First fetch the trip to get destination info
    const { data: tripData, error: fetchError } = await supabase
      .from("trips")
      .select("destination_city, destination_country, travelers")
      .eq("id", tripId)
      .single();

    if (fetchError) {
      console.error("Error fetching trip for claim:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase
      .from("trips")
      .update({
        organizer_id: user.id,
        link_created_at: new Date().toISOString(),
        link_expires_at: expiresAt.toISOString(),
      } as never)
      .eq("id", tripId);

    if (error) {
      console.error("Error claiming trip:", error);
      return { success: false, error: error.message };
    }

    // Trigger share image generation in background (fire and forget)
    const travelers = (tripData.travelers as unknown) as TravelerCost[];
    supabase.functions.invoke("generate-share-image", {
      body: {
        tripId,
        destinationCity: tripData.destination_city,
        destinationCountry: tripData.destination_country,
        travelerCount: travelers?.length || 1,
      },
    }).catch(err => {
      console.error("Error triggering share image generation:", err);
    });

    return { success: true };
  } catch (err) {
    console.error("Exception claiming trip:", err);
    return { success: false, error: "Failed to claim trip" };
  }
}
