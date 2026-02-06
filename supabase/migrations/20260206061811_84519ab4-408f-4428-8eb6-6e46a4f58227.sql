-- Create traveler_documents table for storing user's own passport/ID info
CREATE TABLE public.traveler_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'passport',
  full_legal_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  nationality TEXT,
  document_number TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  issue_date DATE,
  place_of_birth TEXT,
  issuing_country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create travel_companions table for storing friends/family info
CREATE TABLE public.travel_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  document_type TEXT DEFAULT 'passport',
  full_legal_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  document_number TEXT,
  expiration_date DATE,
  home_airport_iata TEXT,
  home_airport_name TEXT,
  home_airport_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.traveler_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_companions ENABLE ROW LEVEL SECURITY;

-- RLS policies for traveler_documents
CREATE POLICY "Users can view their own documents"
ON public.traveler_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.traveler_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.traveler_documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.traveler_documents FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for travel_companions
CREATE POLICY "Users can view their own companions"
ON public.travel_companions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companions"
ON public.travel_companions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companions"
ON public.travel_companions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companions"
ON public.travel_companions FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_traveler_documents_updated_at
BEFORE UPDATE ON public.traveler_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_companions_updated_at
BEFORE UPDATE ON public.travel_companions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();