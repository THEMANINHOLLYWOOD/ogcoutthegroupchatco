import { motion } from "framer-motion";

interface TypingIndicatorProps {
  delay?: number;
}

export const TypingIndicator = ({ delay = 0 }: TypingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="bg-bubble-receiver rounded-[1.25rem] rounded-bl-[0.25rem] px-4 py-3 shadow-bubble">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/50"
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
