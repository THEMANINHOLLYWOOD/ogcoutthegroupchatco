-- Add home location fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN home_city text,
ADD COLUMN home_state text,
ADD COLUMN home_country text,
ADD COLUMN home_location_set boolean NOT NULL DEFAULT false;