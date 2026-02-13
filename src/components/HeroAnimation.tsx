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



export const HeroAnimation = () => {
  const currentTime = useCurrentTimeEST();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [destination] = useState<Destination>(VEGAS);
  const typingName = "Sarah";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


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
    <div className="relative w-full max-w-md mx-auto">
      {/* iPhone-like frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative bg-card rounded-[2.5rem] shadow-glass border border-border overflow-hidden"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground rounded-b-2xl z-10" />

        {/* Status bar */}
        <div className="h-12 bg-card flex items-end justify-end px-6 pb-1">
          <span className="text-xs font-medium">{currentTime}</span>
        </div>

        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
            🟩
          </div>
          <div>
            <h3 className="font-semibold text-sm">Wordle 🟩</h3>
            <p className="text-xs text-muted-foreground">Sarah, Mike, You</p>
          </div>
        </div>

        {/* Messages container */}
        <div 
          ref={scrollContainerRef}
          className="h-[400px] overflow-y-auto px-4 py-4 space-y-3 bg-background scroll-smooth"
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
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-border bg-card">
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
        <div className="h-8 bg-card flex items-center justify-center">
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
    </div>
  );
};
