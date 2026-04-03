import { useState } from "react";
import { getBloodRequests, saveBloodRequests, matchDonors, getCurrentUser, extractDistrict, type BloodRequest as BR } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, Clock, MapPin, Send, CheckCircle, XCircle } from "lucide-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export default function BloodRequest() {
  const [requests, setRequests] = useState<BR[]>(getBloodRequests());
  const [form, setForm] = useState({ bloodGroup: "O+", hospitalAddress: "", urgency: "medium" as BR["urgency"] });
  const [matchedDonors, setMatchedDonors] = useState<ReturnType<typeof matchDonors> | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const user = getCurrentUser();
  const isRecipient = user?.role === "recipient" || !user?.role;

  // My sent requests (recipient view)
  const myRequests = requests.filter(r => r.recipientId === user?.id);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hospitalAddress) {
      toast.error("Please enter hospital address");
      return;
    }
    const requestDistrict = extractDistrict(form.hospitalAddress);
    const matches = matchDonors(form.bloodGroup, requestDistrict);
    setMatchedDonors(matches);
  };

  const handleSendRequest = (donor: { id: string; name: string }) => {
    if (!user) return;
    const requestDistrict = extractDistrict(form.hospitalAddress);

    const newReq: BR = {
      id: crypto.randomUUID(),
      donorId: donor.id,
      donorName: donor.name,
      recipientId: user.id,
      recipientName: user.name,
      bloodGroup: form.bloodGroup,
      hospitalAddress: form.hospitalAddress,
      district: requestDistrict,
      urgency: form.urgency,
      status: "pending",
      createdAt: new Date().toISOString(),
      requesterName: user.name,
    };

    const updated = [newReq, ...requests];
    setRequests(updated);
    saveBloodRequests(updated);
    setSentRequests(prev => new Set(prev).add(donor.id));
    toast.success(`Request sent to ${donor.name}!`);
  };

  const statusBadge = (status: string) => {
    if (status === "accepted") return <Badge className="bg-green-600 text-primary-foreground">Accepted ✅</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected ❌</Badge>;
    return <Badge variant="secondary">Pending ⏳</Badge>;
  };

  const urgencyBadge = (urgency: string) => {
    return (
      <Badge variant={urgency === "low" ? "secondary" : "destructive"} className={urgency === "critical" ? "animate-pulse-emergency" : ""}>
        {urgencyLevels.find(u => u.value === urgency)?.label}
      </Badge>
    );
  };

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Request Blood</h1>
      </div>

      {isRecipient && (
        <>
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 space-y-4 mb-8">
            <div>
              <Label htmlFor="bloodGroup">Blood Group Needed</Label>
              <select
                id="bloodGroup"
                value={form.bloodGroup}
                onChange={e => setForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="hospital">Hospital / Location</Label>
              <Input
                id="hospital"
                value={form.hospitalAddress}
                onChange={e => setForm(prev => ({ ...prev, hospitalAddress: e.target.value }))}
                placeholder="Hospital name and full address"
              />
            </div>
            <div>
              <Label>Urgency Level</Label>
              <div className="flex gap-2 mt-1">
                {urgencyLevels.map(u => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, urgency: u.value }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      form.urgency === u.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">Find Matching Donors</Button>
          </form>

          {matchedDonors && matchedDonors.available.length > 0 && (
            <div className="mb-8 bg-accent border border-primary/20 rounded-lg p-4">
              <h2 className="font-semibold text-accent-foreground mb-2">Matching Available Donors</h2>
              <p className="text-xs text-muted-foreground mb-3">Click "Send Request" to request blood from a donor</p>
              <div className="space-y-2">
                {matchedDonors.available.map(d => {
                  const alreadySent = sentRequests.has(d.id) || requests.some(r => r.donorId === d.id && r.recipientId === user?.id && r.status === "pending");
                  return (
                    <div key={d.id} className="flex items-center justify-between text-sm bg-card rounded-md p-3 border">
                      <div>
                        <span className="font-medium text-foreground">{d.name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">{d.bloodGroup}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadySent ? "secondary" : "default"}
                        disabled={alreadySent}
                        onClick={() => handleSendRequest(d)}
                        className="flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        {alreadySent ? "Sent" : "Send Request"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedDonors && matchedDonors.available.length === 0 && (
            <div className="mb-8 bg-muted border rounded-lg p-4 text-center">
              <p className="text-muted-foreground">👉 No matching donors found in your district</p>
            </div>
          )}
        </>
      )}

      {/* My Requests (Recipient view) */}
      {isRecipient && myRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">My Requests</h2>
          <div className="space-y-3">
            {myRequests.map(req => (
              <div key={req.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="font-bold">{req.bloodGroup}</Badge>
                      {urgencyBadge(req.urgency)}
                      {statusBadge(req.status)}
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      {req.status === "accepted" ? (
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" /> Your request to <strong>{req.donorName}</strong> is Accepted</span>
                      ) : req.status === "rejected" ? (
                        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Your request to <strong>{req.donorName}</strong> is Rejected</span>
                      ) : (
                        <span>Request sent to <strong>{req.donorName}</strong> — Pending</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {req.hospitalAddress}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isRecipient && (
        <div className="bg-muted border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">You are signed up as a Donor. Go to your <strong>Dashboard</strong> to view incoming requests.</p>
        </div>
      )}
    </div>
  );
}
