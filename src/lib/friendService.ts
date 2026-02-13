import { supabase } from "@/integrations/supabase/client";

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  home_city: string | null;
  home_country: string | null;
}

export interface FriendWithProfile {
  friendship: FriendshipRow;
  profile: FriendProfile;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  from_user_id: string;
  read: boolean;
  created_at: string;
}

export interface NotificationWithUser extends NotificationRow {
  from_user: FriendProfile | null;
}

// ── Friends ──

export async function sendFriendRequest(addresseeId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if friendship already exists in either direction
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .limit(1);

  if (existing && existing.length > 0) {
    const f = existing[0] as unknown as FriendshipRow;
    if (f.status === "accepted") return { error: "Already friends" };
    if (f.status === "pending") return { error: "Request already pending" };
  }

  const { error: insertErr } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId });

  if (insertErr) return { error: insertErr.message };

  // Create notification for addressee
  await supabase.from("notifications").insert({
    user_id: addresseeId,
    type: "friend_request",
    from_user_id: user.id,
  });

  return { error: null };
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
  requesterId: string
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", friendshipId);

  if (error) return { error: error.message };

  // Notify requester if accepted
  if (accept) {
    await supabase.from("notifications").insert({
      user_id: requesterId,
      type: "friend_accepted",
      from_user_id: user.id,
    });
  }

  return { error: null };
}

export async function removeFriend(friendshipId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  return { error: error?.message ?? null };
}

export async function getFriends(userId: string): Promise<FriendWithProfile[]> {
  // Get all accepted friendships
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error || !friendships) return [];

  // Get profile IDs of friends (the other person)
  const friendIds = (friendships as unknown as FriendshipRow[]).map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  if (friendIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, home_city, home_country")
    .in("id", friendIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as FriendProfile]));

  return (friendships as unknown as FriendshipRow[]).map((f) => {
    const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
    return {
      friendship: f,
      profile: profileMap.get(friendId) ?? { id: friendId, full_name: null, avatar_url: null, email: "", home_city: null, home_country: null },
    };
  });
}

export async function getPendingRequests(userId: string): Promise<FriendWithProfile[]> {
  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "pending")
    .eq("addressee_id", userId);

  if (error || !friendships) return [];

  const requesterIds = (friendships as unknown as FriendshipRow[]).map((f) => f.requester_id);
  if (requesterIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, home_city, home_country")
    .in("id", requesterIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as FriendProfile]));

  return (friendships as unknown as FriendshipRow[]).map((f) => ({
    friendship: f,
    profile: profileMap.get(f.requester_id) ?? { id: f.requester_id, full_name: null, avatar_url: null, email: "", home_city: null, home_country: null },
  }));
}

export async function getFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<FriendshipRow | null> {
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`)
    .limit(1);

  if (!data || data.length === 0) return null;
  return data[0] as unknown as FriendshipRow;
}

// ── Notifications ──

export async function getNotifications(userId: string): Promise<NotificationWithUser[]> {
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !notifications) return [];

  const fromUserIds = [...new Set((notifications as unknown as NotificationRow[]).map((n) => n.from_user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, home_city, home_country")
    .in("id", fromUserIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as FriendProfile]));

  return (notifications as unknown as NotificationRow[]).map((n) => ({
    ...n,
    from_user: profileMap.get(n.from_user_id) ?? null,
  }));
}

export async function markNotificationsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", notificationIds);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return count ?? 0;
}
