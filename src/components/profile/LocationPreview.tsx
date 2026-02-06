import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Building, Globe, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCountryFlag } from '@/data/continents';

interface LocationData {
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
}

interface LocationPreviewProps {
  location: LocationData;
  onConfirm: () => void;
  onRetry: () => void;
  onSkip: () => void;
  isConfirming: boolean;
}

export const LocationPreview = ({ 
  location, 
  onConfirm, 
  onRetry, 
  onSkip,
  isConfirming 
}: LocationPreviewProps) => {
  const [confirmed, setConfirmed] = useState<string[]>([]);

  const flag = location.country ? getCountryFlag(location.country) : '🌍';

  // Animate checkmarks one by one
  const handleConfirm = () => {
    const items: string[] = [];
    if (location.city) items.push('city');
    if (location.state) items.push('state');
    if (location.country) items.push('country');

    items.forEach((item, index) => {
      setTimeout(() => {
        setConfirmed(prev => [...prev, item]);
      }, index * 200);
    });

    // Call actual confirm after animations
    setTimeout(() => {
      onConfirm();
    }, items.length * 200 + 300);
  };

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

      {/* Flag and location header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-center mb-6"
      >
        <span className="text-5xl">{flag}</span>
        <h3 className="text-lg font-semibold mt-2">Is this right?</h3>
      </motion.div>

      {/* Location items */}
      <div className="space-y-3 mb-6">
        {location.city && (
          <LocationItem
            icon={MapPin}
            label="City"
            value={location.city}
            isConfirmed={confirmed.includes('city')}
            delay={0}
          />
        )}
        {location.state && (
          <LocationItem
            icon={Building}
            label="State"
            value={location.state}
            isConfirmed={confirmed.includes('state')}
            delay={0.1}
          />
        )}
        {location.country && (
          <LocationItem
            icon={Globe}
            label="Country"
            value={location.country}
            isConfirmed={confirmed.includes('country')}
            delay={0.2}
          />
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button 
          onClick={handleConfirm} 
          disabled={isConfirming}
          className="w-full"
        >
          <Check className="w-4 h-4 mr-2" />
          {isConfirming ? 'Adding...' : 'This looks right!'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isConfirming}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          That's not quite right
        </Button>
      </div>
    </motion.div>
  );
};

interface LocationItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isConfirmed: boolean;
  delay: number;
}

const LocationItem = ({ icon: Icon, label, value, isConfirmed, delay }: LocationItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 bg-background rounded-xl"
    >
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <AnimatePresence>
        {isConfirmed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
