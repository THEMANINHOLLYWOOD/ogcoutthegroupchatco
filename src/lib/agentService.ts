import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

export interface AgentThread {
  id: string;
  title: string;
  updated_at: string;
}

export async function createThread(userId: string): Promise<string> {
  const { data, error } = await supabase.from("agent_threads").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function listThreads(): Promise<AgentThread[]> {
  const { data, error } = await supabase
    .from("agent_threads")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteThread(id: string) {
  const { error } = await supabase.from("agent_threads").delete().eq("id", id);
  if (error) throw error;
}

export async function loadMessages(threadId: string): Promise<UIMessage[] | null> {
  const { data: thread } = await supabase.from("agent_threads").select("id").eq("id", threadId).maybeSingle();
  if (!thread) return null;
  const { data, error } = await supabase
    .from("agent_messages")
    .select("message")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => r.message as unknown as UIMessage);
}

export const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trip-agent`;
