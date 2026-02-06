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
