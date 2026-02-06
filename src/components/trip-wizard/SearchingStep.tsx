import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Search, Calculator, Sparkles } from "lucide-react";

interface SearchingStepProps {
  destination: string;
  travelerCount: number;
}

const stages = [
  { icon: Search, text: "Searching for the best flights..." },
  { icon: Plane, text: "Comparing airlines and prices..." },
  { icon: Calculator, text: "Calculating costs for everyone..." },
  { icon: Sparkles, text: "Finding the perfect deals..." },
];

export function SearchingStep({ destination, travelerCount }: SearchingStepProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = stages[currentStage].icon;

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      {/* Animated Plane */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Orbit Ring */}
        <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow" />
        
        {/* Center Globe */}
        <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CurrentIcon className="w-10 h-10 text-primary" />
          </motion.div>
        </div>

        {/* Orbiting Plane */}
        <motion.div
          className="absolute w-6 h-6 text-primary"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "64px 64px" }}
        >
          <Plane className="w-6 h-6 -rotate-45" />
        </motion.div>
      </div>

      {/* Status Text */}
      <motion.h2
        key={currentStage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-foreground mb-3"
      >
        {stages[currentStage].text}
      </motion.h2>

      <p className="text-muted-foreground">
        Finding the best options to {destination} for {travelerCount} {travelerCount === 1 ? "traveler" : "travelers"}
      </p>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {stages.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              opacity: index === currentStage ? 1 : 0.3,
              scale: index === currentStage ? 1.2 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
