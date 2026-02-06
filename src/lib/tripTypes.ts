import { TravelerInfo } from "./idExtraction";
import { Airport } from "./airportSearch";

export interface Traveler {
  id: string;
  name: string;
  origin: Airport;
  isOrganizer: boolean;
}

export interface TripSearch {
  organizer: TravelerInfo;
  destination: Airport;
  origin: Airport;
  travelers: Traveler[];
  departureDate: Date;
  returnDate: Date;
}

export interface FlightOption {
  traveler_name: string;
  origin: string;
  destination: string;
  outbound_price: number;
  return_price: number;
  airline: string;
  departure_time: string;
  arrival_time: string;
}

export interface AccommodationOption {
  name: string;
  price_per_night: number;
  total_nights: number;
  rating: number;
  total_price: number;
}

export interface TravelerCost {
  traveler_name: string;
  origin: string;
  destination: string;
  flight_cost: number;
  accommodation_share: number;
  subtotal: number;
}

export interface TripResult {
  flights: FlightOption[];
  accommodation: AccommodationOption;
  breakdown: TravelerCost[];
  total_per_person: number;
  trip_total: number;
}

// Saved trip types for database persistence
export interface SavedTrip {
  id: string;
  organizer_id: string | null;
  organizer_name: string;
  destination_city: string;
  destination_country: string;
  destination_iata: string;
  departure_date: string;
  return_date: string;
  travelers: TravelerCost[];
  flights: FlightOption[];
  accommodation: AccommodationOption | null;
  cost_breakdown: TravelerCost[];
  total_per_person: number;
  trip_total: number;
  itinerary: Itinerary | null;
  itinerary_status: 'pending' | 'generating' | 'complete' | 'failed';
  share_code: string;
  link_created_at: string | null;
  link_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// AI-generated itinerary types
export interface Itinerary {
  overview: string;
  highlights: string[];
  days: DayPlan[];
}

export interface DayPlan {
  day_number: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'attraction' | 'restaurant' | 'event' | 'travel' | 'free_time';
  is_live_event?: boolean;
  estimated_cost?: number;
  tip?: string;
}

// Input types for saving trips
export interface SaveTripInput {
  organizerId?: string;
  organizerName: string;
  destinationCity: string;
  destinationCountry: string;
  destinationIata: string;
  departureDate: string;
  returnDate: string;
  travelers: TravelerCost[];
  flights: FlightOption[];
  accommodation: AccommodationOption | null;
  costBreakdown: TravelerCost[];
  totalPerPerson: number;
  tripTotal: number;
}
