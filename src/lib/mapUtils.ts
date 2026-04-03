// Fetch real hospitals & blood banks near a location using Overpass API (OpenStreetMap)
export interface PlaceResult {
  name: string;
  address: string;
  type: "hospital" | "blood_bank";
  lat: number;
  lng: number;
}

export async function fetchNearbyPlaces(lat: number, lng: number, radius = 5000): Promise<PlaceResult[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="clinic"]["healthcare"="blood_donation"](around:${radius},${lat},${lng});
      node["healthcare"="blood_donation"](around:${radius},${lat},${lng});
      node["amenity"="blood_bank"](around:${radius},${lat},${lng});
      node["healthcare"="blood_bank"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();

    return (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const isBloodBank =
          el.tags?.healthcare === "blood_donation" ||
          el.tags?.healthcare === "blood_bank" ||
          el.tags?.amenity === "blood_bank" ||
          (el.tags?.name || "").toLowerCase().includes("blood");

        const addressParts = [
          el.tags?.["addr:street"],
          el.tags?.["addr:city"],
          el.tags?.["addr:state"],
        ].filter(Boolean);

        return {
          name: el.tags.name,
          address: addressParts.length > 0 ? addressParts.join(", ") : "Address not available",
          type: isBloodBank ? "blood_bank" as const : "hospital" as const,
          lat: el.lat,
          lng: el.lon,
        };
      });
  } catch {
    console.error("Failed to fetch nearby places");
    return [];
  }
}

// Geocode an address to coordinates using Nominatim
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "BloodBridge/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

// Get user's current location
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
