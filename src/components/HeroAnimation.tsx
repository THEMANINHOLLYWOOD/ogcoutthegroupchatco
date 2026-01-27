import { motion } from "framer-motion";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";
import { TripPreviewCard } from "./TripPreviewCard";
import { useState, useEffect } from "react";

const chatMessages = [
  { message: "Who's down for Miami? 🌴", sender: false, name: "Alex" },
  { message: "I'm so in!!", sender: true, name: "You" },
  { message: "Same!! When are we thinking?", sender: false, name: "Jordan" },
  { message: "March 15-20? Found amazing flights", sender: false, name: "Alex" },
  { message: "Yooo let's book it", sender: true, name: "You" },
];

export const HeroAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    // Animate messages one by one
    const messageTimers = chatMessages.map((_, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 1);
      }, 800 + index * 1200);
    });

    // Show typing indicator after messages
    const typingTimer = setTimeout(() => {
      setShowTyping(true);
    }, 800 + chatMessages.length * 1200);

    // Show trip card after typing
    const cardTimer = setTimeout(() => {
      setShowTyping(false);
      setShowCard(true);
    }, 800 + chatMessages.length * 1200 + 2000);

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
            🏖️
          </div>
          <div>
            <h3 className="font-semibold text-sm">Miami Trip Squad</h3>
            <p className="text-xs text-muted-foreground">Alex, Jordan, You</p>
          </div>
        </div>

        {/* Messages container */}
        <div className="h-[400px] overflow-hidden px-4 py-4 space-y-3 bg-background">
          {chatMessages.slice(0, currentStep).map((msg, index) => (
            <div key={index}>
              {!msg.sender && (
                <p className="text-xs text-muted-foreground ml-1 mb-1">{msg.name}</p>
              )}
              <ChatBubble
                message={msg.message}
                sender={msg.sender}
              />
            </div>
          ))}
          
          {showTyping && <TypingIndicator />}
          
          {showCard && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <p className="text-xs text-muted-foreground ml-1 mb-1">Alex</p>
              <TripPreviewCard
                destination="Miami Beach"
                dates="Mar 15 - 20"
                travelers={3}
                pricePerPerson={847}
              />
            </motion.div>
          )}
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
