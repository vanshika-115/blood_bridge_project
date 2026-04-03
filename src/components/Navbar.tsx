import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, setCurrentUser } from "@/lib/storage";
import { Droplet, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/login");
  };

  if (!user) return null;

  const isDonor = user.role === "donor";

  const navItems = isDonor
    ? [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/donors", label: "Donors" },
        { path: "/add-donor", label: "Add Donor" },
        { path: "/map", label: "Map" },
      ]
    : [
        { path: "/blood-request", label: "Request Blood" },
        { path: "/donors", label: "Donors" },
        { path: "/add-donor", label: "Add Donor" },
        { path: "/map", label: "Map" },
      ];

  return (
    <nav className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Droplet className="h-6 w-6" />
          Blood Bridge
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-emergency-dark"
                  : "hover:bg-emergency-dark/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:bg-emergency-dark/50 flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-emergency-dark/30 pb-3">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                location.pathname === item.path ? "bg-emergency-dark" : "hover:bg-emergency-dark/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-emergency-dark/50 flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
