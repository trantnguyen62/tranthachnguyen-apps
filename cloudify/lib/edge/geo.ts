/**
 * Geo Routing Service
 * Provides geolocation data for edge functions
 */

export interface GeoData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  continent?: string;
  isEU?: boolean;
}

/**
 * Extract geo data from Cloudflare headers
 */
export function getGeoFromCloudflare(headers: Headers): GeoData {
  return {
    country: headers.get("cf-ipcountry") || undefined,
    city: headers.get("cf-ipcity") || undefined,
    latitude: parseFloat(headers.get("cf-iplat") || "") || undefined,
    longitude: parseFloat(headers.get("cf-iplon") || "") || undefined,
    region: headers.get("cf-region") || undefined,
    postalCode: headers.get("cf-postal-code") || undefined,
    timezone: headers.get("cf-timezone") || undefined,
    continent: headers.get("cf-ipcontinent") || undefined,
  };
}

/**
 * Extract geo data from Vercel headers
 */
export function getGeoFromVercel(headers: Headers): GeoData {
  const latitude = headers.get("x-vercel-ip-latitude");
  const longitude = headers.get("x-vercel-ip-longitude");

  return {
    country: headers.get("x-vercel-ip-country") || undefined,
    countryCode: headers.get("x-vercel-ip-country") || undefined,
    region: headers.get("x-vercel-ip-country-region") || undefined,
    city: headers.get("x-vercel-ip-city") || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    timezone: headers.get("x-vercel-ip-timezone") || undefined,
  };
}

/**
 * Extract geo data from AWS CloudFront headers
 */
export function getGeoFromCloudFront(headers: Headers): GeoData {
  const latitude = headers.get("cloudfront-viewer-latitude");
  const longitude = headers.get("cloudfront-viewer-longitude");

  return {
    country: headers.get("cloudfront-viewer-country") || undefined,
    countryCode: headers.get("cloudfront-viewer-country") || undefined,
    region: headers.get("cloudfront-viewer-country-region") || undefined,
    city: headers.get("cloudfront-viewer-city") || undefined,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
    postalCode: headers.get("cloudfront-viewer-postal-code") || undefined,
    timezone: headers.get("cloudfront-viewer-time-zone") || undefined,
  };
}

/**
 * Extract geo data from any supported CDN
 */
export function getGeoData(headers: Headers): GeoData {
  // Try Cloudflare first
  if (headers.get("cf-ipcountry")) {
    return getGeoFromCloudflare(headers);
  }

  // Try Vercel
  if (headers.get("x-vercel-ip-country")) {
    return getGeoFromVercel(headers);
  }

  // Try CloudFront
  if (headers.get("cloudfront-viewer-country")) {
    return getGeoFromCloudFront(headers);
  }

  // Fallback to X-Forwarded headers
  return {
    country: headers.get("x-country") || undefined,
    city: headers.get("x-city") || undefined,
  };
}

/**
 * Get user's IP address from headers
 */
export function getClientIP(headers: Headers): string | null {
  // Check various headers in order of preference
  const ipHeaders = [
    "cf-connecting-ip", // Cloudflare
    "x-real-ip", // Nginx proxy
    "x-vercel-forwarded-for", // Vercel
    "x-forwarded-for", // Standard proxy
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can be a comma-separated list
      return value.split(",")[0].trim();
    }
  }

  return null;
}

/**
 * Check if country is in EU
 */
export function isEUCountry(countryCode: string | undefined): boolean {
  if (!countryCode) return false;

  const euCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  ];

  return euCountries.includes(countryCode.toUpperCase());
}

/**
 * Get continent from country code
 */
export function getContinentFromCountry(countryCode: string | undefined): string | undefined {
  if (!countryCode) return undefined;

  const continentMap: Record<string, string> = {
    // North America
    US: "NA", CA: "NA", MX: "NA",
    // Europe
    GB: "EU", DE: "EU", FR: "EU", IT: "EU", ES: "EU", NL: "EU",
    PL: "EU", SE: "EU", NO: "EU", DK: "EU", FI: "EU", CH: "EU",
    AT: "EU", BE: "EU", IE: "EU", PT: "EU", GR: "EU", CZ: "EU",
    RO: "EU", HU: "EU", UA: "EU", RU: "EU",
    // Asia
    CN: "AS", JP: "AS", KR: "AS", IN: "AS", ID: "AS", TH: "AS",
    VN: "AS", MY: "AS", SG: "AS", PH: "AS", TW: "AS", HK: "AS",
    // Oceania
    AU: "OC", NZ: "OC",
    // South America
    BR: "SA", AR: "SA", CO: "SA", CL: "SA", PE: "SA",
    // Africa
    ZA: "AF", EG: "AF", NG: "AF", KE: "AF", MA: "AF",
  };

  return continentMap[countryCode.toUpperCase()];
}

/**
 * Route request to nearest region based on geo
 */
export function getNearestRegion(
  geo: GeoData,
  availableRegions: string[]
): string {
  if (availableRegions.length === 0) {
    return "global";
  }

  if (availableRegions.length === 1) {
    return availableRegions[0];
  }

  // Region preferences by continent
  const regionPreferences: Record<string, string[]> = {
    NA: ["iad1", "sfo1", "ord1"], // US East, US West, Chicago
    EU: ["cdg1", "fra1", "lhr1"], // Paris, Frankfurt, London
    AS: ["nrt1", "sin1", "hkg1"], // Tokyo, Singapore, Hong Kong
    OC: ["syd1", "sin1"],         // Sydney, Singapore
    SA: ["gru1", "iad1"],         // São Paulo, US East
    AF: ["cdg1", "fra1"],         // Paris, Frankfurt
  };

  const continent = geo.continent || getContinentFromCountry(geo.countryCode);
  const preferences = regionPreferences[continent || "NA"] || regionPreferences.NA;

  // Find first available preferred region
  for (const region of preferences) {
    if (availableRegions.includes(region)) {
      return region;
    }
  }

  // Fallback to first available
  return availableRegions[0];
}

/**
 * Device type detection from User-Agent
 */
export function getDeviceType(userAgent: string | null): "desktop" | "mobile" | "tablet" {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();

  // Check for tablets first (some tablets have "mobile" in UA)
  if (
    ua.includes("ipad") ||
    ua.includes("tablet") ||
    (ua.includes("android") && !ua.includes("mobile"))
  ) {
    return "tablet";
  }

  // Check for mobile
  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    ua.includes("android") ||
    ua.includes("blackberry") ||
    ua.includes("windows phone")
  ) {
    return "mobile";
  }

  return "desktop";
}

/**
 * Browser detection from User-Agent
 */
export function getBrowser(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;

  const ua = userAgent.toLowerCase();

  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("opera") || ua.includes("opr/")) return "Opera";
  if (ua.includes("msie") || ua.includes("trident/")) return "IE";

  return undefined;
}

/**
 * OS detection from User-Agent
 */
export function getOS(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;

  const ua = userAgent.toLowerCase();

  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os x") || ua.includes("macos")) return "macOS";
  if (ua.includes("linux") && !ua.includes("android")) return "Linux";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  if (ua.includes("chrome os")) return "ChromeOS";

  return undefined;
}
