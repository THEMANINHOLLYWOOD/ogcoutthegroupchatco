import { motion } from 'framer-motion';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPromptProps {
  onShareLocation: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const LocationPrompt = ({ onShareLocation, onSkip, isLoading }: LocationPromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20"
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
        aria-label="Skip"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <MapPin className="w-8 h-8 text-primary" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2 mb-6"
      >
        <h3 className="text-lg font-semibold">Where do you call home?</h3>
        <p className="text-sm text-muted-foreground">
          We'll add your current city to your travel history
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <Button 
          onClick={onShareLocation} 
          disabled={isLoading}
          className="w-full"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isLoading ? 'Detecting...' : 'Share My Location'}
        </Button>
        
        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          I'll add it manually
        </button>
      </motion.div>

      {/* Privacy note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-muted-foreground text-center mt-4"
      >
        🔒 Your exact location is not stored
      </motion.p>
    </motion.div>
  );
};
