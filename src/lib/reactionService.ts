import { supabase } from "@/integrations/supabase/client";

export interface ActivityReaction {
  id: string;
  trip_id: string;
  user_id: string;
  day_number: number;
  activity_index: number;
  reaction: 'thumbs_up' | 'thumbs_down';
  created_at: string;
}

export interface ReactionCounts {
  thumbs_up: number;
  thumbs_down: number;
  user_reaction: 'thumbs_up' | 'thumbs_down' | null;
}

export type ReactionsMap = Map<string, ReactionCounts>;

function getActivityKey(dayNumber: number, activityIndex: number): string {
  return `${dayNumber}-${activityIndex}`;
}

export async function fetchReactions(tripId: string, userId?: string): Promise<ReactionsMap> {
  const { data, error } = await supabase
    .from("activity_reactions")
    .select("*")
    .eq("trip_id", tripId);

  if (error) {
    console.error("Error fetching reactions:", error);
    return new Map();
  }

  const reactionsMap: ReactionsMap = new Map();

  // Group reactions by activity
  const reactionsByActivity = new Map<string, ActivityReaction[]>();
  
  for (const reaction of data as ActivityReaction[]) {
    const key = getActivityKey(reaction.day_number, reaction.activity_index);
    if (!reactionsByActivity.has(key)) {
      reactionsByActivity.set(key, []);
    }
    reactionsByActivity.get(key)!.push(reaction);
  }

  // Calculate counts for each activity
  for (const [key, reactions] of reactionsByActivity) {
    const counts: ReactionCounts = {
      thumbs_up: reactions.filter(r => r.reaction === 'thumbs_up').length,
      thumbs_down: reactions.filter(r => r.reaction === 'thumbs_down').length,
      user_reaction: null,
    };

    if (userId) {
      const userReaction = reactions.find(r => r.user_id === userId);
      if (userReaction) {
        counts.user_reaction = userReaction.reaction;
      }
    }

    reactionsMap.set(key, counts);
  }

  return reactionsMap;
}

export async function addReaction(
  tripId: string,
  dayNumber: number,
  activityIndex: number,
  reaction: 'thumbs_up' | 'thumbs_down'
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "You must be signed in to react" };
  }

  // Use upsert to handle both insert and update
  const { error } = await supabase
    .from("activity_reactions")
    .upsert(
      {
        trip_id: tripId,
        user_id: user.id,
        day_number: dayNumber,
        activity_index: activityIndex,
        reaction,
      },
      {
        onConflict: 'trip_id,user_id,day_number,activity_index',
      }
    );

  if (error) {
    console.error("Error adding reaction:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeReaction(
  tripId: string,
  dayNumber: number,
  activityIndex: number
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "You must be signed in" };
  }

  const { error } = await supabase
    .from("activity_reactions")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .eq("day_number", dayNumber)
    .eq("activity_index", activityIndex);

  if (error) {
    console.error("Error removing reaction:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function subscribeToReactions(
  tripId: string,
  onUpdate: () => void
): () => void {
  const channel = supabase
    .channel(`reactions-${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activity_reactions',
        filter: `trip_id=eq.${tripId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function getReactionKey(dayNumber: number, activityIndex: number): string {
  return getActivityKey(dayNumber, activityIndex);
}
