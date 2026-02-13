import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Plane, Search, X, MapPin, Building, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getAllCountries, getContinentForCountry } from '@/data/continents';

interface StampData {
  id: string;
  name: string;
  country: string;
  type: 'city' | 'state' | 'country';
}

const STAMP_COLORS = [
  'hsl(0 60% 45%)',
  'hsl(220 60% 45%)',
  'hsl(150 50% 35%)',
  'hsl(280 45% 45%)',
  'hsl(25 70% 45%)',
];

const STAMP_SHAPES = [
  { className: 'w-[72px] h-[72px] rounded-full', hasIcon: true, hasSubtitle: false },
  { className: 'w-[100px] h-[64px] rounded-sm', hasIcon: false, hasSubtitle: true, doubleBorder: true },
  { className: 'w-[90px] h-[60px] rounded-xl', hasIcon: true, hasSubtitle: true },
  { className: 'w-[88px] h-[56px] rounded-[50%]', hasIcon: false, hasSubtitle: true },
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

type AddType = 'city' | 'state' | 'country';

interface TravelStampsProps {
  userId?: string;
  readOnly?: boolean;
}

export const TravelStamps = ({ userId, readOnly = false }: TravelStampsProps) => {
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState<AddType>('city');
  const [searchQuery, setSearchQuery] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const targetUserId = userId || user?.id;
  const allCountries = useMemo(() => getAllCountries(), []);

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

  // Filter countries for the dropdown suggestions
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allCountries.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery, allCountries]);

  const handleAdd = async () => {
    if (!user) return;
    const name = searchQuery.trim();
    if (!name) return;

    setIsSaving(true);
    try {
      if (addType === 'city') {
        if (!selectedCountry) {
          toast({ title: 'Select a country for this city', variant: 'destructive' });
          setIsSaving(false);
          return;
        }
        const { data, error } = await supabase
          .from('visited_cities')
          .insert({ user_id: user.id, city_name: name, country: selectedCountry })
          .select()
          .single();
        if (error) throw error;
        if (data) setStamps((prev) => [...prev, { id: data.id, name: data.city_name, country: data.country, type: 'city' }]);
      } else if (addType === 'state') {
        if (!selectedCountry) {
          toast({ title: 'Select a country for this state', variant: 'destructive' });
          setIsSaving(false);
          return;
        }
        const { error } = await supabase
          .from('visited_states')
          .insert({ user_id: user.id, state_name: name, country: selectedCountry });
        if (error) throw error;
        // States don't appear as stamps currently, but we add them
      } else {
        const continent = getContinentForCountry(name) || 'Other';
        const { data, error } = await supabase
          .from('visited_countries')
          .insert({ user_id: user.id, country_name: name, continent })
          .select()
          .single();
        if (error) throw error;
        if (data) setStamps((prev) => [...prev, { id: data.id, name: data.country_name, country: data.country_name, type: 'country' }]);
      }
      toast({ title: `${addType.charAt(0).toUpperCase() + addType.slice(1)} added!` });
      setSearchQuery('');
      setSelectedCountry('');
    } catch (err: any) {
      toast({ title: 'Failed to add', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountrySuggestionClick = (countryName: string) => {
    if (addType === 'country') {
      setSearchQuery(countryName);
      setSelectedCountry('');
    } else {
      setSelectedCountry(countryName);
      setCountrySearch('');
      setSearchQuery('');
    }
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
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="h-7 px-2 text-xs rounded-lg text-muted-foreground"
          >
            {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 mr-1" />}
            {isAdding ? '' : 'Add'}
          </Button>
        )}
      </div>

      {/* Inline Add Section */}
      <AnimatePresence>
        {isAdding && !readOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 overflow-hidden"
          >
            {/* Type Tabs */}
            <div className="flex gap-1.5 mb-3">
              {([
                { type: 'city' as AddType, icon: MapPin, label: 'City' },
                { type: 'state' as AddType, icon: Building, label: 'State' },
                { type: 'country' as AddType, icon: Globe, label: 'Country' },
              ]).map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => { setAddType(type); setSearchQuery(''); setSelectedCountry(''); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    addType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  addType === 'city' ? 'Type a city name...'
                  : addType === 'state' ? 'Type a state name...'
                  : 'Search for a country...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted border-0 rounded-xl"
                autoFocus
              />
            </div>

            {/* Country suggestions (for country type) */}
            {addType === 'country' && filteredCountries.length > 0 && (
              <div className="mt-2 space-y-0.5 max-h-[180px] overflow-y-auto">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setSearchQuery(c.name); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-muted transition-colors text-foreground"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Country selector for city/state */}
            {addType !== 'country' && (
              <div className="mt-2">
                {selectedCountry ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-xl">
                    <span className="text-sm text-foreground">{selectedCountry}</span>
                    <button onClick={() => setSelectedCountry('')} className="text-muted-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Input
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="h-8 text-xs bg-muted border-0 rounded-xl"
                    />
                    {countrySearch && (
                      <div className="mt-1 space-y-0.5 max-h-[140px] overflow-y-auto">
                        {allCountries
                          .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                          .slice(0, 5)
                          .map((c) => (
                            <button
                              key={c.code}
                              onClick={() => handleCountrySuggestionClick(c.name)}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-muted transition-colors text-foreground"
                            >
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!searchQuery.trim() || isSaving || (addType !== 'country' && !selectedCountry)}
              className="w-full mt-3 h-8 text-xs rounded-xl"
            >
              <Check className="w-3 h-3 mr-1" />
              {isSaving ? 'Adding...' : `Add ${addType}`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {stamps.length === 0 ? (
        <p className="text-sm text-center py-6 text-muted-foreground/40">
          No stamps yet
        </p>
      ) : (
        <div className="flex flex-wrap gap-3 items-center justify-center py-2 px-1">
          {stamps.map((stamp, i) => {
            const hash = hashCode(stamp.id);
            const rotation = (hash % 12) - 6;
            const color = STAMP_COLORS[hash % STAMP_COLORS.length];
            const shape = STAMP_SHAPES[hash % STAMP_SHAPES.length];
            const opacity = 0.75 + (hash % 16) / 100;
            const showSubtitle = shape.hasSubtitle && stamp.type === 'city';

            return (
              <motion.div
                key={stamp.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400, damping: 20 }}
                className={`${shape.className} border-2 flex flex-col items-center justify-center p-1.5 relative`}
                style={{
                  borderColor: color,
                  color,
                  transform: `rotate(${rotation}deg)`,
                  opacity,
                }}
              >
                {shape.doubleBorder && (
                  <div
                    className="absolute inset-[3px] rounded-sm border pointer-events-none"
                    style={{ borderColor: color }}
                  />
                )}
                {shape.hasIcon && (
                  <Plane className="w-2.5 h-2.5 mb-0.5" strokeWidth={2.5} />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight line-clamp-2">
                  {stamp.name}
                </span>
                {showSubtitle && (
                  <span className="text-[7px] uppercase tracking-wide opacity-70 mt-0.5">
                    {stamp.country}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
