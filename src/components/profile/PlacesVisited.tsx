import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Building, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { continents, getAllCountries, getCountryFlag, getContinentForCountry } from '@/data/continents';
import { LocationPrompt } from './LocationPrompt';
import { LocationPreview } from './LocationPreview';
import { useLocationDetection } from '@/hooks/useLocationDetection';

interface City {
  id: string;
  city_name: string;
  country: string;
}

interface State {
  id: string;
  state_name: string;
  country: string;
}

interface Country {
  id: string;
  country_name: string;
  continent: string;
}

export const PlacesVisited = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addType, setAddType] = useState<'city' | 'state' | 'country'>('city');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  
  // Form states
  const [newCity, setNewCity] = useState('');
  const [newCityCountry, setNewCityCountry] = useState('');
  const [newState, setNewState] = useState('');
  const [newStateCountry, setNewStateCountry] = useState('');
  const [newCountry, setNewCountry] = useState('');

  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { location, isLoading: isDetecting, error: locationError, detectLocation, reset: resetLocation } = useLocationDetection();

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // Check if we should show location prompt
  useEffect(() => {
    if (profile && !profile.home_location_set && !isLoading) {
      setShowLocationPrompt(true);
    }
  }, [profile, isLoading]);

  // Show error toast if location detection fails
  useEffect(() => {
    if (locationError) {
      toast({
        title: 'Location Error',
        description: locationError,
        variant: 'destructive',
      });
    }
  }, [locationError, toast]);

  const fetchAll = async () => {
    if (!user) return;

    const [citiesRes, statesRes, countriesRes] = await Promise.all([
      supabase.from('visited_cities').select('*').eq('user_id', user.id).order('city_name'),
      supabase.from('visited_states').select('*').eq('user_id', user.id).order('state_name'),
      supabase.from('visited_countries').select('*').eq('user_id', user.id).order('country_name'),
    ]);

    if (citiesRes.data) setCities(citiesRes.data);
    if (statesRes.data) setStates(statesRes.data);
    if (countriesRes.data) setCountries(countriesRes.data);
    setIsLoading(false);
  };

  const handleAddCity = async () => {
    if (!user || !newCity || !newCityCountry) return;

    const { data, error } = await supabase
      .from('visited_cities')
      .insert({ user_id: user.id, city_name: newCity, country: newCityCountry })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to add city', description: error.message, variant: 'destructive' });
    } else if (data) {
      setCities((prev) => [...prev, data].sort((a, b) => a.city_name.localeCompare(b.city_name)));
      setNewCity('');
      setNewCityCountry('');
      setIsDialogOpen(false);
      toast({ title: 'City added!' });
    }
  };

  const handleAddState = async () => {
    if (!user || !newState || !newStateCountry) return;

    const { data, error } = await supabase
      .from('visited_states')
      .insert({ user_id: user.id, state_name: newState, country: newStateCountry })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to add state', description: error.message, variant: 'destructive' });
    } else if (data) {
      setStates((prev) => [...prev, data].sort((a, b) => a.state_name.localeCompare(b.state_name)));
      setNewState('');
      setNewStateCountry('');
      setIsDialogOpen(false);
      toast({ title: 'State added!' });
    }
  };

  const handleAddCountry = async () => {
    if (!user || !newCountry) return;

    const continent = getContinentForCountry(newCountry) || 'Other';

    const { data, error } = await supabase
      .from('visited_countries')
      .insert({ user_id: user.id, country_name: newCountry, continent })
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to add country', description: error.message, variant: 'destructive' });
    } else if (data) {
      setCountries((prev) => [...prev, data].sort((a, b) => a.country_name.localeCompare(b.country_name)));
      setNewCountry('');
      setIsDialogOpen(false);
      toast({ title: 'Country added!' });
    }
  };

  const handleDeleteCity = async (id: string) => {
    await supabase.from('visited_cities').delete().eq('id', id);
    setCities((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteState = async (id: string) => {
    await supabase.from('visited_states').delete().eq('id', id);
    setStates((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteCountry = async (id: string) => {
    await supabase.from('visited_countries').delete().eq('id', id);
    setCountries((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSkipLocation = async () => {
    if (!user) return;
    
    // Mark as set so we don't prompt again
    await supabase
      .from('profiles')
      .update({ home_location_set: true })
      .eq('id', user.id);
    
    setShowLocationPrompt(false);
    resetLocation();
    await refreshProfile();
  };

  const handleConfirmLocation = async () => {
    if (!user || !location) return;

    setIsConfirmingLocation(true);

    try {
      // Add city if present and not duplicate
      if (location.city && location.country) {
        const { data: existingCity } = await supabase
          .from('visited_cities')
          .select('id')
          .eq('user_id', user.id)
          .eq('city_name', location.city)
          .eq('country', location.country)
          .maybeSingle();

        if (!existingCity) {
          const { data } = await supabase
            .from('visited_cities')
            .insert({ user_id: user.id, city_name: location.city, country: location.country })
            .select()
            .single();
          if (data) setCities(prev => [...prev, data]);
        }
      }

      // Add state if present and not duplicate
      if (location.state && location.country) {
        const { data: existingState } = await supabase
          .from('visited_states')
          .select('id')
          .eq('user_id', user.id)
          .eq('state_name', location.state)
          .eq('country', location.country)
          .maybeSingle();

        if (!existingState) {
          const { data } = await supabase
            .from('visited_states')
            .insert({ user_id: user.id, state_name: location.state, country: location.country })
            .select()
            .single();
          if (data) setStates(prev => [...prev, data]);
        }
      }

      // Add country if present and not duplicate
      if (location.country) {
        const continent = getContinentForCountry(location.country) || 'Other';
        const { data: existingCountry } = await supabase
          .from('visited_countries')
          .select('id')
          .eq('user_id', user.id)
          .eq('country_name', location.country)
          .maybeSingle();

        if (!existingCountry) {
          const { data } = await supabase
            .from('visited_countries')
            .insert({ user_id: user.id, country_name: location.country, continent })
            .select()
            .single();
          if (data) setCountries(prev => [...prev, data]);
        }
      }

      // Update profile with home location
      await supabase
        .from('profiles')
        .update({
          home_city: location.city,
          home_state: location.state,
          home_country: location.country,
          home_location_set: true,
        })
        .eq('id', user.id);

      setShowLocationPrompt(false);
      resetLocation();
      await refreshProfile();
      
      toast({ title: 'Home location added!' });
    } catch (err) {
      console.error('Error confirming location:', err);
      toast({
        title: 'Failed to save location',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const toggleContinent = (name: string) => {
    setExpandedContinents((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const countriesByContinent = continents.reduce((acc, cont) => {
    acc[cont.name] = countries.filter((c) => c.continent === cont.name);
    return acc;
  }, {} as Record<string, Country[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Location Prompt */}
      <AnimatePresence>
        {showLocationPrompt && !location && (
          <LocationPrompt
            onShareLocation={detectLocation}
            onSkip={handleSkipLocation}
            isLoading={isDetecting}
          />
        )}
        {showLocationPrompt && location && (
          <LocationPreview
            location={location}
            onConfirm={handleConfirmLocation}
            onRetry={() => {
              resetLocation();
            }}
            onSkip={handleSkipLocation}
            isConfirming={isConfirmingLocation}
          />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{cities.length}</p>
          <p className="text-xs text-muted-foreground">Cities</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{states.length}</p>
          <p className="text-xs text-muted-foreground">States</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{countries.length}</p>
          <p className="text-xs text-muted-foreground">Countries</p>
        </div>
      </div>

      {/* Add Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Place
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Place You've Visited</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Button
                variant={addType === 'city' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddType('city')}
              >
                <MapPin className="w-4 h-4 mr-1" />
                City
              </Button>
              <Button
                variant={addType === 'state' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddType('state')}
              >
                <Building className="w-4 h-4 mr-1" />
                State
              </Button>
              <Button
                variant={addType === 'country' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddType('country')}
              >
                <Globe className="w-4 h-4 mr-1" />
                Country
              </Button>
            </div>

            {addType === 'city' && (
              <>
                <div className="space-y-2">
                  <Label>City Name</Label>
                  <Input
                    placeholder="New York"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={newCityCountry} onValueChange={setNewCityCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCountries().map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCity} disabled={!newCity || !newCityCountry}>
                  Add City
                </Button>
              </>
            )}

            {addType === 'state' && (
              <>
                <div className="space-y-2">
                  <Label>State/Province Name</Label>
                  <Input
                    placeholder="California"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={newStateCountry} onValueChange={setNewStateCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCountries().map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddState} disabled={!newState || !newStateCountry}>
                  Add State
                </Button>
              </>
            )}

            {addType === 'country' && (
              <>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={newCountry} onValueChange={setNewCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllCountries().map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCountry} disabled={!newCountry}>
                  Add Country
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cities Section */}
      {cities.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Cities ({cities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {cities.map((city) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                >
                  <span>{getCountryFlag(city.country)}</span>
                  <span>{city.city_name}</span>
                  <button
                    onClick={() => handleDeleteCity(city.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* States Section */}
      {states.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Building className="w-4 h-4" />
            States/Provinces ({states.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {states.map((state) => (
                <motion.div
                  key={state.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                >
                  <span>{getCountryFlag(state.country)}</span>
                  <span>{state.state_name}</span>
                  <button
                    onClick={() => handleDeleteState(state.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Countries by Continent */}
      {countries.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Countries by Continent
          </h3>
          <div className="space-y-2">
            {continents.map((continent) => {
              const continentCountries = countriesByContinent[continent.name] || [];
              if (continentCountries.length === 0) return null;

              return (
                <Collapsible
                  key={continent.name}
                  open={expandedContinents.includes(continent.name)}
                  onOpenChange={() => toggleContinent(continent.name)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                      <span className="font-medium">
                        {continent.name} ({continentCountries.length})
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedContinents.includes(continent.name) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="flex flex-wrap gap-2 pl-3">
                      <AnimatePresence>
                        {continentCountries.map((country) => (
                          <motion.div
                            key={country.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-sm"
                          >
                            <span>{getCountryFlag(country.country_name)}</span>
                            <span>{country.country_name}</span>
                            <button
                              onClick={() => handleDeleteCountry(country.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
