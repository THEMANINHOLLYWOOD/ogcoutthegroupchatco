-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_photos table
CREATE TABLE public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own photos" ON public.user_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos" ON public.user_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" ON public.user_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Create travel_media table with media_type enum
CREATE TYPE public.media_type AS ENUM ('photo', 'video');

CREATE TABLE public.travel_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type public.media_type NOT NULL DEFAULT 'photo',
  caption TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.travel_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own travel media" ON public.travel_media
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel media" ON public.travel_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel media" ON public.travel_media
  FOR DELETE USING (auth.uid() = user_id);

-- Create visited_cities table
CREATE TABLE public.visited_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  visited_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visited_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cities" ON public.visited_cities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cities" ON public.visited_cities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cities" ON public.visited_cities
  FOR DELETE USING (auth.uid() = user_id);

-- Create visited_states table
CREATE TABLE public.visited_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_name TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visited_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own states" ON public.visited_states
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own states" ON public.visited_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own states" ON public.visited_states
  FOR DELETE USING (auth.uid() = user_id);

-- Create visited_countries table
CREATE TABLE public.visited_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  continent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visited_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own countries" ON public.visited_countries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own countries" ON public.visited_countries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own countries" ON public.visited_countries
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for updating profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-media', 'travel-media', false);

-- Storage policies for avatars (public read, auth write)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for user-photos (auth only)
CREATE POLICY "Users can view their own photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for travel-media (auth only)
CREATE POLICY "Users can view their own travel media" ON storage.objects
  FOR SELECT USING (bucket_id = 'travel-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own travel media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'travel-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own travel media" ON storage.objects
  FOR DELETE USING (bucket_id = 'travel-media' AND auth.uid()::text = (storage.foldername(name))[1]);