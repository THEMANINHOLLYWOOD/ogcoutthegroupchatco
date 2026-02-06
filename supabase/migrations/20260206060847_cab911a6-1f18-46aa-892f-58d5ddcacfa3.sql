-- Enable realtime for trips table to stream itinerary updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;