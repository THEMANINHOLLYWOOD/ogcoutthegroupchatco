import { motion } from "framer-motion";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";
import { TripPreviewCard } from "./TripPreviewCard";
import { useState, useEffect, useRef } from "react";

const chatMessages = [
  { message: "Wordle 847 3/6 🟩🟩⬛🟩🟩", sender: false, name: "Sarah" },
  { message: "Wordle 847 5/6 😤 that was hard", sender: false, name: "Mike" },
  { message: "Wordle 847 2/6 😎🟩🟩🟩🟩🟩", sender: true, name: "You" },
  { message: "NO WAY", sender: false, name: "Sarah" },
  { message: "ok we need to celebrate this... Vegas?", sender: false, name: "Mike" },
  { message: "I'm so down 🎰", sender: true, name: "You" },
  { message: "wait I found this app that books everything", sender: false, name: "Sarah" },
];

// Custom timing for each message (in ms from start)
const messageTimings = [800, 1800, 3000, 3600, 4600, 5600, 6800];

export const HeroAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages appear (container only, not page)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentStep, showTyping, showCard]);

  useEffect(() => {
    // Animate messages with custom timing
    const messageTimers = messageTimings.map((timing, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 1);
      }, timing);
    });

    // Show typing indicator after last message
    const typingTimer = setTimeout(() => {
      setShowTyping(true);
    }, 8000);

    // Show trip card after typing
    const cardTimer = setTimeout(() => {
      setShowTyping(false);
      setShowCard(true);
    }, 10000);

    return () => {
      messageTimers.forEach(clearTimeout);
      clearTimeout(typingTimer);
      clearTimeout(cardTimer);
    };
  }, []);

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
        <div className="h-12 bg-card flex items-end justify-between px-8 pb-1">
          <span className="text-xs font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-2 bg-foreground rounded-sm" />
            <div className="w-4 h-2 bg-foreground rounded-sm" />
            <div className="w-6 h-3 bg-foreground rounded-sm" />
          </div>
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
          {chatMessages.slice(0, currentStep).map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {!msg.sender && (
                <p className="text-xs text-muted-foreground ml-1 mb-1">{msg.name}</p>
              )}
              <ChatBubble
                message={msg.message}
                sender={msg.sender}
              />
            </motion.div>
          ))}
          
          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-xs text-muted-foreground ml-1 mb-1">Sarah</p>
              <TypingIndicator />
            </motion.div>
          )}
          
          {showCard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <p className="text-xs text-muted-foreground ml-1 mb-1">Sarah</p>
              <TripPreviewCard
                destination="Las Vegas"
                dates="Mar 22 - 25"
                travelers={3}
                pricePerPerson={649}
                imageUrl="https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80"
              />
            </motion.div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">+</span>
            </div>
            <div className="flex-1 bg-muted rounded-full px-4 py-2">
              <span className="text-sm text-muted-foreground">iMessage</span>
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
