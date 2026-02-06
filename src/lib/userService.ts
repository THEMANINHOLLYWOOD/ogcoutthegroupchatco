import { supabase } from "@/integrations/supabase/client";

export interface PlatformUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  home_country: string | null;
}

export async function searchUsers(query: string): Promise<PlatformUser[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const searchTerm = query.trim().replace(/@/g, '');
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, home_city, home_country")
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }

  return data || [];
}

export async function getUserById(userId: string): Promise<PlatformUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, home_city, home_country")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
