import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts a valid UUID from a potentially corrupted string.
 * Handles cases where share platforms append extra text to URLs.
 * 
 * Example: "0e4c087b-9c0a-40ad-9310-065960ac584c Join our trip" 
 *       → "0e4c087b-9c0a-40ad-9310-065960ac584c"
 */
export function extractUUID(input: string | undefined): string | null {
  if (!input) return null;
  
  // UUID v4 regex pattern - matches at the start of the string
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = input.match(uuidPattern);
  
  return match ? match[0] : null;
}
