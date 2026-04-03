import { Link } from "react-router-dom";
import { getCurrentUser, getDonors, getBloodRequests } from "@/lib/storage";
import { Users, UserPlus, AlertTriangle, MapPin, Droplet, LayoutDashboard } from "lucide-react";

export default function Home() {
  const user = getCurrentUser();
  const donors = getDonors();
  const requests = getBloodRequests();
  const isDonor = user?.role === "donor";

  const pendingForDonor = isDonor
    ? requests.filter(r => {
        const myDonor = donors.find(d => d.userId === user?.id || d.name === user?.name);
        return myDonor && r.donorId === myDonor.id && r.status === "pending";
      }).length
    : 0;

  const quickLinks = isDonor
    ? [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", desc: `${pendingForDonor} pending requests` },
        { to: "/donors", icon: Users, label: "View Donors", desc: `${donors.length} registered` },
        { to: "/add-donor", icon: UserPlus, label: "Add Donor", desc: "Register a donor" },
        { to: "/map", icon: MapPin, label: "Map", desc: "Find nearby help" },
      ]
    : [
        { to: "/blood-request", icon: AlertTriangle, label: "Request Blood", desc: "Find donors" },
        { to: "/donors", icon: Users, label: "View Donors", desc: `${donors.length} registered` },
        { to: "/add-donor", icon: UserPlus, label: "Add Donor", desc: "Register a donor" },
        { to: "/map", icon: MapPin, label: "Map", desc: "Find nearby help" },
      ];

  return (
    <div className="container py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <Droplet className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isDonor ? "🩸 Donor Account" : "🏥 Recipient Account"}
        </p>
        <p className="text-muted-foreground mt-1">Every drop counts. Connect with donors and save lives.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-card border rounded-lg p-5 hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <link.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="font-semibold text-foreground">{link.label}</h2>
            <p className="text-sm text-muted-foreground">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
