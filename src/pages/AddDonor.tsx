import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDonors, saveDonors, extractDistrict, getCurrentUser, type Donor } from "@/lib/storage";
import { isValidContact, sanitizeContactInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AddDonor() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [form, setForm] = useState({
    name: user?.name || "", bloodGroup: "O+", contact: user?.contact || "", address: user?.location || "", donations: "0",
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.address) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isValidContact(form.contact)) {
      toast.error("Please enter a valid 10-digit contact number");
      return;
    }

    const donors = getDonors();
    const newDonor: Donor = {
      id: crypto.randomUUID(),
      userId: user?.id,
      name: form.name,
      bloodGroup: form.bloodGroup,
      contact: form.contact,
      address: form.address,
      district: extractDistrict(form.address),
      available: true,
      donations: parseInt(form.donations) || 0,
    };
    donors.push(newDonor);
    saveDonors(donors);
    toast.success("Donor added successfully!");
    navigate("/donors");
  };

  return (
    <div className="container py-6 max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Add Donor</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Donor's full name" />
        </div>
        <div>
          <Label htmlFor="bloodGroup">Blood Group *</Label>
          <select
            id="bloodGroup"
            value={form.bloodGroup}
            onChange={e => update("bloodGroup", e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="contact">Contact Number *</Label>
          <Input id="contact" value={form.contact} onChange={e => update("contact", sanitizeContactInput(e.target.value))} placeholder="10-digit number" maxLength={10} />
          {form.contact.length > 0 && !isValidContact(form.contact) && (
            <p className="text-xs text-destructive mt-1">Please enter a valid 10-digit contact number</p>
          )}
        </div>
        <div>
          <Label htmlFor="address">Full Address *</Label>
          <Input id="address" value={form.address} onChange={e => update("address", e.target.value)} placeholder="Complete address" />
        </div>
        <div>
          <Label htmlFor="donations">Number of Past Donations</Label>
          <Input id="donations" type="number" min="0" value={form.donations} onChange={e => update("donations", e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Add Donor</Button>
      </form>
    </div>
  );
}
