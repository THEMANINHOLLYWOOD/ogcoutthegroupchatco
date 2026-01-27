import { motion } from "framer-motion";

interface ChatBubbleProps {
  message: string;
  sender?: boolean;
  delay?: number;
  showTail?: boolean;
  className?: string;
}

export const ChatBubble = ({ 
  message, 
  sender = false, 
  delay = 0,
  showTail = true,
  className = ""
}: ChatBubbleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay,
        duration: 0.4,
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      className={`flex ${sender ? "justify-end" : "justify-start"} ${className}`}
    >
      <div
        className={`
          relative max-w-xs sm:max-w-sm md:max-w-md px-4 py-2.5 shadow-bubble
          ${sender 
            ? "bg-primary text-primary-foreground rounded-[1.25rem] rounded-br-[0.25rem]" 
            : "bg-bubble-receiver text-bubble-receiver-foreground rounded-[1.25rem] rounded-bl-[0.25rem]"
          }
        `}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </motion.div>
  );
};
