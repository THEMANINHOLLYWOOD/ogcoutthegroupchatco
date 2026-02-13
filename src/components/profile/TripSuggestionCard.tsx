import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getCountryFlag } from '@/data/continents';

interface Destination {
  city: string;
  country: string;
  tagline: string;
}

const DESTINATIONS: Destination[] = [
  { city: 'Tokyo', country: 'Japan', tagline: 'Where tradition meets tomorrow' },
  { city: 'Marrakech', country: 'Morocco', tagline: 'A maze of color and spice' },
  { city: 'Reykjavik', country: 'Iceland', tagline: 'Fire and ice at the edge of the world' },
  { city: 'Cartagena', country: 'Colombia', tagline: 'Caribbean charm with colonial soul' },
  { city: 'Lisbon', country: 'Portugal', tagline: 'Sunset tiles and pastel hills' },
  { city: 'Cape Town', country: 'South Africa', tagline: 'Where mountains meet the sea' },
  { city: 'Kyoto', country: 'Japan', tagline: 'Quiet temples, cherry blossoms' },
  { city: 'Buenos Aires', country: 'Argentina', tagline: 'Tango and steak at midnight' },
  { city: 'Dubrovnik', country: 'Croatia', tagline: 'Adriatic jewel in ancient walls' },
  { city: 'Bali', country: 'Indonesia', tagline: 'Emerald rice terraces and temple sunsets' },
  { city: 'Prague', country: 'Czech Republic', tagline: 'Gothic spires over the Vltava' },
  { city: 'Havana', country: 'Cuba', tagline: 'Classic cars and Caribbean rhythm' },
  { city: 'Santorini', country: 'Greece', tagline: 'White walls above an indigo caldera' },
  { city: 'Medellín', country: 'Colombia', tagline: 'The city of eternal spring' },
  { city: 'Chiang Mai', country: 'Thailand', tagline: 'Night markets and mountain temples' },
  { city: 'Amalfi', country: 'Italy', tagline: 'Lemon groves on vertical cliffs' },
  { city: 'Cusco', country: 'Peru', tagline: 'Gateway to the lost empire' },
  { city: 'Seoul', country: 'South Korea', tagline: 'K-pop, kimchi, and neon lights' },
  { city: 'Zanzibar', country: 'Tanzania', tagline: 'Spice island with turquoise shores' },
  { city: 'Porto', country: 'Portugal', tagline: 'Port wine and Douro valley views' },
  { city: 'Queenstown', country: 'New Zealand', tagline: 'Adventure capital of the south' },
  { city: 'Jaipur', country: 'India', tagline: 'The pink city of maharajas' },
  { city: 'Tulum', country: 'Mexico', tagline: 'Mayan ruins above turquoise waves' },
  { city: 'Amsterdam', country: 'Netherlands', tagline: 'Canals, bikes, and golden age' },
  { city: 'Petra', country: 'Jordan', tagline: 'Rose-red city half as old as time' },
  { city: 'Edinburgh', country: 'United Kingdom', tagline: 'Castle on the rock, stories in the mist' },
  { city: 'Hoi An', country: 'Vietnam', tagline: 'Lantern-lit lanes by the river' },
  { city: 'Bogotá', country: 'Colombia', tagline: 'Street art and Andean coffee' },
  { city: 'Fez', country: 'Morocco', tagline: 'The world\'s oldest living medina' },
  { city: 'Oaxaca', country: 'Mexico', tagline: 'Mezcal and ancient ruins' },
];

export const TripSuggestionCard = () => {
  const [suggestion, setSuggestion] = useState<Destination | null>(null);
  const [visitedCities, setVisitedCities] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadVisitedAndSuggest();
  }, [user]);

  const loadVisitedAndSuggest = async () => {
    if (!user) return;
    const { data } = await supabase.from('visited_cities').select('city_name').eq('user_id', user.id);
    const visited = new Set((data || []).map((c) => c.city_name.toLowerCase()));
    setVisitedCities(visited);
    pickSuggestion(visited);
  };

  const pickSuggestion = (visited: Set<string>) => {
    const available = DESTINATIONS.filter((d) => !visited.has(d.city.toLowerCase()));
    if (available.length === 0) {
      setSuggestion(DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)]);
    } else {
      setSuggestion(available[Math.floor(Math.random() * available.length)]);
    }
  };

  const shuffle = () => pickSuggestion(visitedCities);

  if (!suggestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: 'hsl(var(--passport-gold-muted) / 0.5)' }}>
        Next Destination
      </p>

      <motion.div
        layout
        className="rounded-xl p-4 relative overflow-hidden"
        style={{ background: 'hsl(var(--passport-navy-light))' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCountryFlag(suggestion.country)}</span>
              <h3 className="text-base font-semibold" style={{ color: 'hsl(var(--passport-gold))' }}>
                {suggestion.city}
              </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'hsl(var(--passport-gold-muted) / 0.6)' }}>
              {suggestion.tagline}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={shuffle}
            className="h-8 w-8 rounded-lg flex-shrink-0"
            style={{ color: 'hsl(var(--passport-gold-muted))' }}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button
          onClick={() => navigate('/create-trip')}
          className="w-full h-10 rounded-xl text-sm font-medium gap-2"
          style={{ background: 'hsl(var(--passport-gold))', color: 'hsl(var(--passport-navy))' }}
        >
          Book a trip to {suggestion.city}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
