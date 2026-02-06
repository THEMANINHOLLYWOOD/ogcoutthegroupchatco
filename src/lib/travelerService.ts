import { supabase } from "@/integrations/supabase/client";
import { TravelerInfo } from "./idExtraction";

export interface SavedDocument {
  id: string;
  user_id: string;
  document_type: string;
  full_legal_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  nationality?: string;
  document_number: string;
  expiration_date: string;
  issue_date?: string;
  place_of_birth?: string;
  issuing_country?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedCompanion {
  id: string;
  user_id: string;
  nickname: string;
  document_type: string;
  full_legal_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  document_number?: string;
  expiration_date?: string;
  home_airport_iata?: string;
  home_airport_name?: string;
  home_airport_city?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanionInput {
  nickname: string;
  document_type?: string;
  full_legal_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  document_number?: string;
  expiration_date?: string;
  home_airport_iata?: string;
  home_airport_name?: string;
  home_airport_city?: string;
}

/**
 * Save or update user's own travel document
 */
export async function saveUserDocument(
  userId: string,
  travelerInfo: TravelerInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    const documentData = {
      user_id: userId,
      document_type: travelerInfo.document_type || "passport",
      full_legal_name: travelerInfo.full_legal_name || "",
      first_name: travelerInfo.first_name || "",
      middle_name: travelerInfo.middle_name || null,
      last_name: travelerInfo.last_name || "",
      date_of_birth: travelerInfo.date_of_birth || null,
      gender: travelerInfo.gender || null,
      nationality: travelerInfo.nationality || null,
      document_number: travelerInfo.document_number || "",
      expiration_date: travelerInfo.expiration_date || null,
      issue_date: travelerInfo.issue_date || null,
      place_of_birth: travelerInfo.place_of_birth || null,
      issuing_country: travelerInfo.issuing_country || null,
    };

    // Upsert - update if exists, insert if not
    const { error } = await supabase
      .from("traveler_documents")
      .upsert(documentData, { onConflict: "user_id" });

    if (error) {
      console.error("Error saving document:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error saving document:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save document",
    };
  }
}

/**
 * Get user's saved travel document
 */
export async function getUserDocument(
  userId: string
): Promise<SavedDocument | null> {
  try {
    const { data, error } = await supabase
      .from("traveler_documents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching document:", error);
      return null;
    }

    return data as SavedDocument | null;
  } catch (err) {
    console.error("Error fetching document:", err);
    return null;
  }
}

/**
 * Save a travel companion
 */
export async function saveCompanion(
  userId: string,
  companion: CompanionInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("travel_companions")
      .insert({
        user_id: userId,
        nickname: companion.nickname,
        document_type: companion.document_type || "passport",
        full_legal_name: companion.full_legal_name,
        first_name: companion.first_name,
        middle_name: companion.middle_name || null,
        last_name: companion.last_name,
        date_of_birth: companion.date_of_birth || null,
        gender: companion.gender || null,
        nationality: companion.nationality || null,
        document_number: companion.document_number || null,
        expiration_date: companion.expiration_date || null,
        home_airport_iata: companion.home_airport_iata || null,
        home_airport_name: companion.home_airport_name || null,
        home_airport_city: companion.home_airport_city || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error saving companion:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("Error saving companion:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save companion",
    };
  }
}

/**
 * Get all travel companions for a user
 */
export async function getCompanions(userId: string): Promise<SavedCompanion[]> {
  try {
    const { data, error } = await supabase
      .from("travel_companions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching companions:", error);
      return [];
    }

    return (data || []) as SavedCompanion[];
  } catch (err) {
    console.error("Error fetching companions:", err);
    return [];
  }
}

/**
 * Update a travel companion
 */
export async function updateCompanion(
  companionId: string,
  updates: Partial<CompanionInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("travel_companions")
      .update(updates)
      .eq("id", companionId);

    if (error) {
      console.error("Error updating companion:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error updating companion:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update companion",
    };
  }
}

/**
 * Delete a travel companion
 */
export async function deleteCompanion(
  companionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("travel_companions")
      .delete()
      .eq("id", companionId);

    if (error) {
      console.error("Error deleting companion:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting companion:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete companion",
    };
  }
}

/**
 * Convert TravelerInfo to CompanionInput
 */
export function travelerInfoToCompanion(
  info: TravelerInfo,
  nickname: string
): CompanionInput {
  return {
    nickname,
    document_type: info.document_type,
    full_legal_name: info.full_legal_name || "",
    first_name: info.first_name || "",
    middle_name: info.middle_name,
    last_name: info.last_name || "",
    date_of_birth: info.date_of_birth,
    gender: info.gender,
    nationality: info.nationality,
    document_number: info.document_number,
    expiration_date: info.expiration_date,
  };
}
