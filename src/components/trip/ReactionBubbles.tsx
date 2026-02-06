import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactionCounts } from "@/lib/reactionService";

interface ReactionBubblesProps {
  counts: ReactionCounts;
  onReact: (reaction: 'thumbs_up' | 'thumbs_down') => void;
  disabled?: boolean;
}

export function ReactionBubbles({ counts, onReact, disabled }: ReactionBubblesProps) {
  const { thumbs_up, thumbs_down, user_reaction } = counts;

  return (
    <div className="flex items-center gap-2">
      {/* Thumbs Up */}
      <motion.button
        onClick={() => onReact('thumbs_up')}
        disabled={disabled}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm",
          "transition-colors duration-200 touch-manipulation",
          "min-w-[52px] justify-center",
          user_reaction === 'thumbs_up'
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.span
          animate={{ 
            scale: user_reaction === 'thumbs_up' ? [1, 1.3, 1] : 1 
          }}
          transition={{ duration: 0.3 }}
          className="text-base"
        >
          👍
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span
            key={thumbs_up}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="font-medium text-xs"
          >
            {thumbs_up}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Thumbs Down */}
      <motion.button
        onClick={() => onReact('thumbs_down')}
        disabled={disabled}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm",
          "transition-colors duration-200 touch-manipulation",
          "min-w-[52px] justify-center",
          user_reaction === 'thumbs_down'
            ? "bg-destructive/20 text-destructive"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.span
          animate={{ 
            scale: user_reaction === 'thumbs_down' ? [1, 1.3, 1] : 1 
          }}
          transition={{ duration: 0.3 }}
          className="text-base"
        >
          👎
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span
            key={thumbs_down}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="font-medium text-xs"
          >
            {thumbs_down}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
