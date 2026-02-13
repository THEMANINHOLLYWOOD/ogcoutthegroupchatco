import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getCountryFlag } from '@/data/continents';

interface StampData {
  id: string;
  name: string;
  country: string;
  type: 'city' | 'state' | 'country';
}

const STAMP_COLORS = [
  'hsl(0 60% 45%)',    // red
  'hsl(220 60% 45%)',  // blue
  'hsl(150 50% 35%)',  // green
  'hsl(280 45% 45%)',  // purple
  'hsl(25 70% 45%)',   // orange
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface TravelStampsProps {
  userId?: string;
  readOnly?: boolean;
  onAddStamp?: () => void;
}

export const TravelStamps = ({ userId, readOnly = false, onAddStamp }: TravelStampsProps) => {
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) fetchStamps();
  }, [targetUserId]);

  const fetchStamps = async () => {
    if (!targetUserId) return;
    const [cities, countries] = await Promise.all([
      supabase.from('visited_cities').select('id, city_name, country').eq('user_id', targetUserId),
      supabase.from('visited_countries').select('id, country_name, continent').eq('user_id', targetUserId),
    ]);

    const allStamps: StampData[] = [
      ...(cities.data || []).map((c) => ({ id: c.id, name: c.city_name, country: c.country, type: 'city' as const })),
      ...(countries.data || []).map((c) => ({ id: c.id, name: c.country_name, country: c.country_name, type: 'country' as const })),
    ];
    setStamps(allStamps);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-20 rounded-xl animate-pulse bg-muted" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
          Travel Stamps · {stamps.length}
        </p>
        {!readOnly && onAddStamp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddStamp}
            className="h-7 px-2 text-xs rounded-lg text-muted-foreground"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {stamps.length === 0 ? (
        <p className="text-sm text-center py-6 text-muted-foreground/40">
          No stamps yet
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stamps.map((stamp, i) => {
            const hash = hashCode(stamp.id);
            const rotation = (hash % 17) - 8;
            const color = STAMP_COLORS[hash % STAMP_COLORS.length];
            const flag = getCountryFlag(stamp.country);

            return (
              <motion.div
                key={stamp.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 20 }}
                className="flex flex-col items-center justify-center w-[68px] h-[68px] rounded-lg border-2 border-dashed p-1"
                style={{
                  borderColor: color,
                  transform: `rotate(${rotation}deg)`,
                  opacity: 0.85,
                }}
              >
                <span className="text-lg leading-none">{flag}</span>
                <span
                  className="text-[8px] uppercase tracking-wider font-semibold text-center leading-tight mt-1 line-clamp-2"
                  style={{ color }}
                >
                  {stamp.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
