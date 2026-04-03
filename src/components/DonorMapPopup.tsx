import { useEffect, useRef, useState } from "react";
import { type Donor } from "@/lib/storage";
import { geocodeAddress, getCurrentLocation } from "@/lib/mapUtils";
import { Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DONOR_ICON = L.divIcon({
  className: "",
  html: `<div style="background:hsl(0,72%,51%);color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">D</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const USER_ICON = L.divIcon({
  className: "",
  html: `<div style="background:hsl(220,80%,55%);color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  donor: Donor;
}

export default function DonorMapPopup({ donor }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const init = async () => {
      let donorCoords: { lat: number; lng: number } | null = null;

      // Use existing coords or geocode address
      if (donor.lat && donor.lng) {
        donorCoords = { lat: donor.lat, lng: donor.lng };
      } else {
        donorCoords = await geocodeAddress(donor.address);
      }

      if (!donorCoords) {
        setError("Could not find location for this address");
        setLoading(false);
        return;
      }

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
      }).setView([donorCoords.lat, donorCoords.lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;

      // Donor marker
      L.marker([donorCoords.lat, donorCoords.lng], { icon: DONOR_ICON })
        .addTo(map)
        .bindPopup(`<b>${donor.name}</b><br/><span style="font-size:12px">${donor.address}</span><br/><b style="color:#991b1b">${donor.bloodGroup}</b>`)
        .openPopup();

      // User location + route line
      try {
        const userPos = await getCurrentLocation();
        L.marker([userPos.lat, userPos.lng], { icon: USER_ICON })
          .addTo(map)
          .bindPopup("<b>Your Location</b>");

        // Draw a line between user and donor
        L.polyline(
          [[userPos.lat, userPos.lng], [donorCoords.lat, donorCoords.lng]],
          { color: "hsl(0,72%,51%)", weight: 3, dashArray: "8,8", opacity: 0.7 }
        ).addTo(map);

        // Fit both markers in view
        const bounds = L.latLngBounds(
          [userPos.lat, userPos.lng],
          [donorCoords.lat, donorCoords.lng]
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {
        // User location unavailable, just show donor
      }

      setLoading(false);
    };

    init();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [donor]);

  if (error) {
    return (
      <div className="mt-3 rounded-md border p-4 text-sm text-destructive text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md overflow-hidden border relative" style={{ height: 250 }}>
      {loading && (
        <div className="absolute inset-0 bg-background/80 z-[1000] flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading map...</span>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
