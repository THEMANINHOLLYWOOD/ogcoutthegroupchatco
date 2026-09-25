import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowUp, Plus, MessageSquare, Trash2, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AGENT_URL, createThread, deleteThread, listThreads, loadMessages, AgentThread } from "@/lib/agentService";
import { ToolCard } from "@/components/agent/ToolCards";
import { TypingIndicator } from "@/components/TypingIndicator";
import { toast } from "@/hooks/use-toast";

export default function Chat() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [showList, setShowList] = useState(!threadId);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    listThreads().then(setThreads).catch(() => setThreads([]));
  }, [threadId]);

  useEffect(() => {
    setInitial(null);
    if (!threadId) return;
    loadMessages(threadId).then((m) => {
      if (m === null) navigate("/chat", { replace: true });
      else setInitial(m);
    });
  }, [threadId, navigate]);

  const newChat = async () => {
    if (!user) return;
    const id = await createThread(user.id);
    setShowList(false);
    navigate(`/chat/${id}`);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-lg">
        <Link to="/" aria-label="Home" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="text-sm font-medium truncate max-w-[60%]">{threads.find((t) => t.id === threadId)?.title || "Trip agent"}</span>
        <div className="flex items-center gap-3">
          <button aria-label="Chats" onClick={() => setShowList((v) => !v)} className="text-muted-foreground hover:text-foreground"><MessageSquare className="w-5 h-5" /></button>
          <button aria-label="New chat" onClick={newChat} className="text-muted-foreground hover:text-foreground"><Plus className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <AnimatePresence>
          {showList && (
            <motion.aside
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute md:static inset-x-0 top-14 bottom-0 z-20 md:w-72 bg-background md:border-r border-border overflow-y-auto p-3 space-y-1"
            >
              {threads.map((t) => (
                <div key={t.id} className={`group flex items-center rounded-xl ${t.id === threadId ? "bg-secondary" : "hover:bg-secondary/60"}`}>
                  <button className="flex-1 text-left px-3 py-2.5 text-sm truncate" onClick={() => { setShowList(false); navigate(`/chat/${t.id}`); }}>{t.title}</button>
                  <button aria-label="Delete chat" className="px-3 text-muted-foreground opacity-60 hover:opacity-100"
                    onClick={async () => { await deleteThread(t.id); setThreads((x) => x.filter((y) => y.id !== t.id)); if (t.id === threadId) navigate("/chat"); }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!threads.length && <p className="text-sm text-muted-foreground px-3 py-2">No chats yet.</p>}
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0 flex flex-col">
          {threadId && initial ? (
            <ChatWindow key={threadId} threadId={threadId} initialMessages={initial} onActivity={() => listThreads().then(setThreads)} />
          ) : (
            <div className="flex-1 grid place-items-center text-center px-6">
              <div className="space-y-4">
                <h1 className="text-2xl font-semibold tracking-tight">Where do you want to go?</h1>
                <button onClick={newChat} className="rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm">Start a chat</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ChatWindow({ threadId, initialMessages, onActivity }: { threadId: string; initialMessages: UIMessage[]; onActivity: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: AGENT_URL,
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        return {
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        };
      },
      body: { threadId },
    }),
    onFinish: onActivity,
  });

  useEffect(() => {
    const q = (location.state as { initial?: string } | null)?.initial;
    if (q && !sentInitial.current && initialMessages.length === 0) {
      sentInitial.current = true;
      navigate(location.pathname, { replace: true, state: null });
      sendMessage({ text: q });
    }
  }, [location, initialMessages.length, navigate, sendMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (status === "ready") inputRef.current?.focus();
  }, [status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    sendMessage({ text: q });
    setInput("");
  };

  const approve = async (bookingId: string) => {
    const { data, error } = await supabase.functions.invoke("booking-checkout", { body: { bookingId } });
    if (error || !data?.url) {
      toast({ title: "Checkout isn't available yet", description: "Payments are still being connected.", variant: "destructive" });
      return;
    }
    window.location.href = data.url;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={m.role === "user" ? "flex justify-end" : "space-y-3"}>
              {m.parts.map((p: any, i) => {
                if (p.type === "text") {
                  return m.role === "user" ? (
                    <div key={i} className="max-w-[80%] rounded-[1.25rem] rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-[15px] whitespace-pre-wrap">{p.text}</div>
                  ) : (
                    <div key={i} className="prose prose-sm max-w-none text-foreground [&_p]:my-1.5 [&_a]:text-primary"><ReactMarkdown>{p.text}</ReactMarkdown></div>
                  );
                }
                if (String(p.type).startsWith("tool-")) return <ToolCard key={i} part={p} onApprove={approve} />;
                return null;
              })}
            </motion.div>
          ))}
          {status === "submitted" && <TypingIndicator />}
          {error && <p className="text-sm text-destructive">{error.message || "Something went wrong."}</p>}
          <div ref={endRef} />
        </div>
      </div>
      <form onSubmit={submit} className="shrink-0 border-t border-border p-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2 rounded-3xl border border-border bg-card pl-4 pr-1.5 py-1.5">
          <textarea
            ref={inputRef}
            autoFocus
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Where do you want to go?"
            className="flex-1 resize-none bg-transparent py-2 text-[15px] outline-none max-h-40 placeholder:text-muted-foreground"
          />
          {busy ? (
            <button type="button" onClick={stop} aria-label="Stop" className="h-9 w-9 rounded-full bg-secondary grid place-items-center"><Square className="w-3.5 h-3.5" /></button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Send" className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"><ArrowUp className="w-4 h-4" /></button>
          )}
        </div>
      </form>
    </>
  );
}
