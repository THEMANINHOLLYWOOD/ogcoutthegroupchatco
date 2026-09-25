import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createThread } from "@/lib/agentService";
import { toast } from "@/hooks/use-toast";

export function AgentBar({ className = "" }: { className?: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setBusy(true);
    try {
      const id = await createThread(user.id);
      navigate(`/chat/${id}`, { state: { initial: q } });
    } catch (err) {
      toast({ title: "Couldn't start a chat", description: String((err as Error).message), variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-2 rounded-full border border-border bg-card pl-5 pr-1.5 h-12 shadow-soft focus-within:ring-2 focus-within:ring-primary/30 transition-shadow ${className}`}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Where do you want to go?"
        aria-label="Where do you want to go?"
        className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={!text.trim() || busy}
        aria-label="Send"
        className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40 transition-opacity"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </motion.form>
  );
}
