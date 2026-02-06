import Fuse from "fuse.js";
import airports from "@/data/airports.json";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Create Fuse instance for fuzzy search
const fuse = new Fuse(airports, {
  keys: [
    { name: "iata", weight: 0.4 },
    { name: "city", weight: 0.3 },
    { name: "name", weight: 0.2 },
    { name: "country", weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
});

// Popular airports to show as default suggestions
const popularAirportCodes = ["JFK", "LAX", "LHR", "CDG", "DXB", "SIN", "HND", "ORD", "ATL", "SFO"];

export function searchAirports(query: string): Airport[] {
  if (!query || query.trim().length === 0) {
    return getPopularAirports();
  }

  const results = fuse.search(query.trim(), { limit: 10 });
  return results.map((result) => result.item as Airport);
}

export function getAirportByIata(code: string): Airport | undefined {
  return airports.find((a) => a.iata.toLowerCase() === code.toLowerCase()) as Airport | undefined;
}

export function getPopularAirports(): Airport[] {
  return popularAirportCodes
    .map((code) => getAirportByIata(code))
    .filter((a): a is Airport => a !== undefined);
}

// Calculate distance between two points using Haversine formula
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearestAirport(lat: number, lng: number): Airport {
  let nearest: Airport = airports[0] as Airport;
  let minDistance = Infinity;

  for (const airport of airports) {
    const distance = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = airport as Airport;
    }
  }

  return nearest;
}

export function getUserLocationAirport(): Promise<Airport | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = getNearestAirport(
          position.coords.latitude,
          position.coords.longitude
        );
        resolve(nearest);
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}

export function formatAirportDisplay(airport: Airport): string {
  return `${airport.iata} - ${airport.city}, ${airport.country}`;
}

export function formatAirportShort(airport: Airport): string {
  return `${airport.iata} - ${airport.city}`;
}
