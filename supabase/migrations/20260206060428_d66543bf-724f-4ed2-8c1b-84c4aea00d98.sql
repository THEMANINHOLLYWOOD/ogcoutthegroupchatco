-- Create trips table for shareable trip pages
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_iata TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  travelers JSONB NOT NULL DEFAULT '[]'::jsonb,
  flights JSONB DEFAULT '[]'::jsonb,
  accommodation JSONB,
  cost_breakdown JSONB DEFAULT '[]'::jsonb,
  total_per_person NUMERIC NOT NULL DEFAULT 0,
  trip_total NUMERIC NOT NULL DEFAULT 0,
  itinerary JSONB,
  itinerary_status TEXT NOT NULL DEFAULT 'pending' CHECK (itinerary_status IN ('pending', 'generating', 'complete', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Anyone can view trips (public sharing)
CREATE POLICY "Anyone can view trips"
ON public.trips
FOR SELECT
USING (true);

-- Anyone can insert trips (guest checkout support)
CREATE POLICY "Anyone can insert trips"
ON public.trips
FOR INSERT
WITH CHECK (true);

-- Only organizer can update their own trips
CREATE POLICY "Organizers can update their own trips"
ON public.trips
FOR UPDATE
USING (organizer_id IS NULL OR auth.uid() = organizer_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();