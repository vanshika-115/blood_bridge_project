import { useEffect, useRef, useState } from "react";
import { getDonors, getCurrentUser, type Donor } from "@/lib/storage";
import { geocodeAddress } from "@/lib/mapUtils";
import { fetchNearbyPlaces, getCurrentLocation, type PlaceResult } from "@/lib/mapUtils";
import { MapPin, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HOSPITAL_ICON = L.divIcon({
  className: "",
  html: `<div style="font-size:24px;text-shadow:0 1px 3px rgba(0,0,0,.3)">🏥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const BLOOD_BANK_ICON = L.divIcon({
  className: "",
  html: `<div style="font-size:24px;text-shadow:0 1px 3px rgba(0,0,0,.3)">🩸</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

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

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter: [number, number] = [28.6139, 77.2090]; // Delhi
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      doubleClickZoom: true,
    }).setView(defaultCenter, 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    // Get user location and load real data
    const init = async () => {
      let center = defaultCenter;
      const user = getCurrentUser();

      // Use signup location if available
      if (user?.location) {
        const geo = await geocodeAddress(user.location);
        if (geo) {
          center = [geo.lat, geo.lng];
          setUserPos(geo);
          map.setView(center, 13);
          L.marker(center, { icon: USER_ICON })
            .addTo(map)
            .bindPopup(`<b>Your Location</b><br/><span style="font-size:12px;color:#666">${user.location}</span>`)
            .openPopup();
        }
      }

      // Fallback to geolocation if no signup location
      if (!userPos && center === defaultCenter) {
        try {
          const pos = await getCurrentLocation();
          center = [pos.lat, pos.lng];
          setUserPos(pos);
          map.setView(center, 13);
          L.marker(center, { icon: USER_ICON })
            .addTo(map)
            .bindPopup("<b>Your Location</b>")
            .openPopup();
        } catch {
          // Use default center
        }
      }

      // Fetch real hospitals & blood banks
      const results = await fetchNearbyPlaces(center[0], center[1]);
      setPlaces(results);

      results.forEach((place) => {
        const icon = place.type === "hospital" ? HOSPITAL_ICON : BLOOD_BANK_ICON;
        const typeLabel = place.type === "hospital" ? "Hospital" : "Blood Bank";
        L.marker([place.lat, place.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:180px">
              <b>${place.name}</b><br/>
              <span style="color:#666;font-size:12px">${place.address}</span><br/>
              <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${place.type === "hospital" ? "#dbeafe" : "#fde8e8"};color:${place.type === "hospital" ? "#1e40af" : "#991b1b"}">${typeLabel}</span>
            </div>`
          )
          .on("click", function () {
            map.setView([place.lat, place.lng], 16);
          });
      });

      // Add donor markers
      const donors = getDonors().filter((d) => d.lat && d.lng);
      donors.forEach((d) => {
        L.marker([d.lat!, d.lng!], { icon: DONOR_ICON })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <b>${d.name}</b><br/>
              <span style="color:#666;font-size:12px">${d.address}</span><br/>
              <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#fde8e8;color:#991b1b">${d.bloodGroup}</span>
            </div>`
          )
          .on("click", function () {
            map.setView([d.lat!, d.lng!], 15);
          });
      });

      setLoading(false);
    };

    init();

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const hospitals = places.filter((p) => p.type === "hospital");
  const bloodBanks = places.filter((p) => p.type === "blood_bank");

  const handlePlaceClick = (lat: number, lng: number) => {
    mapInstance.current?.setView([lat, lng], 16);
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Map</h1>
      </div>

      <div className="rounded-lg overflow-hidden border mb-6 relative" style={{ height: 450 }}>
        {loading && (
          <div className="absolute inset-0 bg-background/80 z-[1000] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading map...</span>
          </div>
        )}
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            🏥 Nearby Hospitals
          </h2>
          <div className="space-y-2">
            {hospitals.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No hospitals found nearby.</p>
            )}
            {hospitals.map((h, i) => (
              <button
                key={i}
                onClick={() => handlePlaceClick(h.lat, h.lng)}
                className="w-full text-left bg-card border rounded-md p-3 hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{h.name}</p>
                <p className="text-xs text-muted-foreground">{h.address}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            🩸 Blood Banks
          </h2>
          <div className="space-y-2">
            {bloodBanks.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No blood banks found nearby.</p>
            )}
            {bloodBanks.map((b, i) => (
              <button
                key={i}
                onClick={() => handlePlaceClick(b.lat, b.lng)}
                className="w-full text-left bg-card border rounded-md p-3 hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.address}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Donor Locations
          </h2>
          <div className="space-y-2">
            {getDonors().filter((d) => d.lat && d.lng).length === 0 && (
              <p className="text-sm text-muted-foreground">No donors with location data.</p>
            )}
            {getDonors()
              .filter((d) => d.lat && d.lng)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => handlePlaceClick(d.lat!, d.lng!)}
                  className="w-full text-left bg-card border rounded-md p-3 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.bloodGroup} • {d.address}
                  </p>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
