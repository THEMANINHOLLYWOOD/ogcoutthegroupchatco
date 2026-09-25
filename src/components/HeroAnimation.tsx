import { motion } from "framer-motion";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";
import { TripPreviewCard } from "./TripPreviewCard";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";


const useCurrentTimeEST = () => {
  const [time, setTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
};

interface Destination {
  city: string;
  country: string;
  emoji: string;
  price_estimate: number;
  imageUrl: string;
}

const VEGAS: Destination = {
  city: "Las Vegas",
  country: "USA",
  emoji: "🎰",
  price_estimate: 580,
  imageUrl: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80",
};

interface ChatMessage {
  name: string;
  message: string;
  sender: boolean;
  isCard?: boolean;
}

interface HeroAnimationProps {
  expanded?: boolean;
  onComplete?: () => void;
}

const buildMessages = (dest: Destination): ChatMessage[] => [
  { message: "Wordle 1,681 3/6\n\n⬜🟨⬜⬜🟩\n🟩⬜🟨🟩🟩\n🟩🟩🟩🟩🟩", sender: false, name: "Sarah" },
  { message: "Wordle 1,681 5/6\n\n⬜⬜⬜⬜⬜\n⬜🟨⬜🟨⬜\n🟨🟩⬜🟩⬜\n🟩🟩⬜🟩🟩\n🟩🟩🟩🟩🟩", sender: false, name: "Mike" },
  { message: "Wordle 1,681 2/6\n\n🟩🟩🟨⬜🟩\n🟩🟩🟩🟩🟩", sender: true, name: "You" },
  { message: "NO WAY", sender: false, name: "Sarah" },
  { message: `ok we need to celebrate this... ${dest.city}? ${dest.emoji}`, sender: false, name: "Mike" },
  { message: "I'm so down 🎰", sender: true, name: "You" },
  { message: "wait I found this app that books everything", sender: false, name: "Sarah" },
];

const messageTimings = [800, 1800, 3000, 3600, 4600, 5600, 6800];



export const HeroAnimation = ({ expanded = false, onComplete }: HeroAnimationProps) => {
  const currentTime = useCurrentTimeEST();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [destination] = useState<Destination>(VEGAS);
  const typingName = "Sarah";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);


  // Auto-scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, showTyping]);

  // Animation sequence — rebuild when destination changes
  useEffect(() => {
    const allMessages = buildMessages(destination);

    const messageTimers = messageTimings.map((timing, index) => {
      return setTimeout(() => {
        setMessages(allMessages.slice(0, index + 1));
      }, timing);
    });

    const typingTimer = setTimeout(() => {
      setShowTyping(true);
    }, 8000);

    const cardTimer = setTimeout(() => {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        name: "Sarah",
        message: "card",
        sender: false,
        isCard: true
      }]);
      onCompleteRef.current?.();
    }, 10000);

    return () => {
      messageTimers.forEach(clearTimeout);
      clearTimeout(typingTimer);
      clearTimeout(cardTimer);
    };
  }, [destination]);

  const handleCardClick = () => {
    navigate(`/create-trip?destination=${encodeURIComponent(destination.city)}`);
  };

  return (
    <motion.div
      animate={{
        maxWidth: expanded ? "calc(100vw - 1.5rem)" : "18rem",
      }}
      transition={{ type: "spring", stiffness: 90, damping: 22, mass: 0.9 }}
      className="relative mx-auto w-full sm:max-w-md"
    >
      {/* iPhone-like frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-glass sm:rounded-[2.5rem]"
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground sm:h-7 sm:w-32" />

        {/* Status bar */}
        <div className="flex h-10 items-end justify-end bg-card px-5 pb-1 sm:h-12 sm:px-6">
          <span className="text-xs font-medium">{currentTime}</span>
        </div>

        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground sm:h-10 sm:w-10">
            🟩
          </div>
          <div>
            <h3 className="font-semibold text-sm">Wordle 🟩</h3>
            <p className="text-xs text-muted-foreground">Sarah, Mike, You</p>
          </div>
        </div>

        {/* Messages container */}
        <motion.div 
          ref={scrollContainerRef}
          animate={{ height: expanded ? "calc(100dvh - 15rem)" : "250px" }}
          transition={{ type: "spring", stiffness: 90, damping: 22, mass: 0.9 }}
          className="min-h-[250px] max-h-[calc(100dvh-15rem)] space-y-3 overflow-y-auto bg-background px-3 py-3 scroll-smooth sm:h-[400px] sm:max-h-none sm:px-4 sm:py-4"
        >
          {messages.map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {!msg.sender && (
                <p className="text-xs text-muted-foreground ml-1 mb-1">{msg.name}</p>
              )}
              {msg.isCard ? (
                <TripPreviewCard
                  destination={`${destination.city}, ${destination.country}`}
                  dates="Mar 22 - 25"
                  travelers={3}
                  pricePerPerson={destination.price_estimate}
                  imageUrl={destination.imageUrl}
                  onClick={handleCardClick}
                />
              ) : (
                <ChatBubble
                  message={msg.message}
                  sender={msg.sender}
                />
              )}
            </motion.div>
          ))}
          
          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xs text-muted-foreground ml-1 mb-1">
                {typingName}
              </p>
              <TypingIndicator />
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Input bar */}
        <div className="border-t border-border bg-card p-2.5 sm:p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">+</span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground">
                iMessage
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex h-6 items-center justify-center bg-card sm:h-8">
          <div className="w-32 h-1 bg-foreground/20 rounded-full" />
        </div>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-8 -right-8 w-20 h-20 bg-primary/10 rounded-full blur-2xl"
      />
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/10 rounded-full blur-2xl"
      />
    </motion.div>
  );
};
