import { useState, useMemo } from "react";
import { getDonors, isDonorAvailable, getBlockedDaysRemaining, type Donor } from "@/lib/storage";
import { Phone, MessageSquare, MapPin, User, Droplet, Heart, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DonorMapPopup from "@/components/DonorMapPopup";

function DonorCard({ donor, showUnavailable }: { donor: Donor; showUnavailable?: boolean }) {
  const [showMap, setShowMap] = useState(false);
  const blockedDays = getBlockedDaysRemaining(donor);

  return (
    <div className={`bg-card border rounded-lg p-4 ${showUnavailable ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <User className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{donor.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {donor.address}
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="text-sm font-bold">
          {donor.bloodGroup}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" /> {donor.donations} donations
        </span>
        {showUnavailable && blockedDays > 0 && (
          <span className="text-destructive text-xs flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Blocked until: {new Date(donor.blockedUntil!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            ({blockedDays} days left)
          </span>
        )}
        {showUnavailable && blockedDays === 0 && donor.lastDonationDate && (
          <span className="text-destructive text-xs">
            Recently donated
          </span>
        )}
      </div>

      {!showUnavailable && (
        <div className="mt-3 flex items-center gap-2">
          <a
            href={`tel:${donor.contact}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-emergency-dark transition-colors"
          >
            <Phone className="h-3 w-3" /> Call
          </a>
          <a
            href={`sms:${donor.contact}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-3 w-3" /> Message
          </a>
          <button
            onClick={() => setShowMap(!showMap)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-muted transition-colors"
          >
            <MapPin className="h-3 w-3" /> Location
          </button>
        </div>
      )}

      {showMap && <DonorMapPopup donor={donor} />}
    </div>
  );
}

export default function DonorList() {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const donors = getDonors();

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const { available, unavailable } = useMemo(() => {
    let filtered = donors;
    if (search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.address.toLowerCase().includes(search.toLowerCase()));
    if (filterGroup) filtered = filtered.filter(d => d.bloodGroup === filterGroup);

    const available: Donor[] = [];
    const unavailable: Donor[] = [];
    filtered.forEach(d => {
      if (isDonorAvailable(d)) available.push(d);
      else unavailable.push(d);
    });
    return { available, unavailable };
  }, [donors, search, filterGroup]);

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Droplet className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Donor List</h1>
        <span className="text-sm text-muted-foreground ml-2">(Only available donors shown)</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Groups</option>
          {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {available.length === 0 && <p className="text-muted-foreground text-center py-8">No available donors found.</p>}
        {available.map(d => <DonorCard key={d.id} donor={d} />)}
      </div>

      {unavailable.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Unavailable Donors (Blocked)
          </h2>
          <div className="space-y-3">
            {unavailable.map(d => <DonorCard key={d.id} donor={d} showUnavailable />)}
          </div>
        </div>
      )}
    </div>
  );
}
