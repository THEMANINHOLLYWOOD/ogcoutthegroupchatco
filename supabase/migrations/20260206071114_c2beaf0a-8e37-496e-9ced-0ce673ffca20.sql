-- Create activity_reactions table for emoji reactions on itinerary activities
CREATE TABLE public.activity_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  activity_index integer NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('thumbs_up', 'thumbs_down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (trip_id, user_id, day_number, activity_index)
);

-- Enable RLS
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions for trips they can view
CREATE POLICY "Anyone can view reactions"
  ON public.activity_reactions FOR SELECT
  USING (true);

-- Authenticated users can insert their own reactions
CREATE POLICY "Users can add their own reactions"
  ON public.activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON public.activity_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own reactions  
CREATE POLICY "Users can delete own reactions"
  ON public.activity_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;