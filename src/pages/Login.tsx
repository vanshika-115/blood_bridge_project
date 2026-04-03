import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, saveUsers, setCurrentUser, extractDistrict, type User } from "@/lib/storage";
import { isValidContact, sanitizeContactInput } from "@/lib/validation";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", location: "", contact: "", password: "", role: "recipient" as "donor" | "recipient" });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();

    if (isSignup) {
      if (!form.name || !form.email || !form.password || !form.location || !form.contact) {
        toast.error("Please fill all fields");
        return;
      }
      if (!isValidContact(form.contact)) {
        toast.error("Please enter a valid 10-digit contact number");
        return;
      }
      if (users.find(u => u.email === form.email)) {
        toast.error("Email already registered");
        return;
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        name: form.name,
        email: form.email,
        location: form.location,
        contact: form.contact,
        password: form.password,
        district: extractDistrict(form.location),
        role: form.role,
      };
      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      toast.success(`Welcome, ${newUser.name}!`);
      navigate("/");
    } else {
      const user = users.find(u => u.email === form.email && u.password === form.password);
      if (!user) {
        toast.error("Invalid email or password");
        return;
      }
      setCurrentUser(user);
      toast.success(`Welcome, ${user.name}!`);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Droplet className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Blood Bridge</h1>
          <p className="text-muted-foreground mt-1">Connect donors. Save lives.</p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                !isSignup ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                isSignup ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Full Name" />
                </div>
                <div>
                  <Label>Sign up as</Label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => update("role", "donor")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                        form.role === "donor"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                      }`}
                    >
                      🩸 Donor
                    </button>
                    <button
                      type="button"
                      onClick={() => update("role", "recipient")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                        form.role === "recipient"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                      }`}
                    >
                      🏥 Recipient
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={e => update("location", e.target.value)} placeholder="Full Address" />
                </div>
                <div>
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input id="contact" value={form.contact} onChange={e => update("contact", sanitizeContactInput(e.target.value))} placeholder="10-digit number" maxLength={10} />
                  {form.contact.length > 0 && !isValidContact(form.contact) && (
                    <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit contact number</p>
                  )}
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">
              {isSignup ? "Create Account" : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
