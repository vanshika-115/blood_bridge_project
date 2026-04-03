import { useState } from "react";
import { getBloodRequests, getCurrentUser, acceptRequest, rejectRequest, getDonors, getBlockedDaysRemaining, isDonorAvailable } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, CheckCircle, XCircle, MapPin, Clock, ShieldAlert } from "lucide-react";

export default function DonorDashboard() {
  const user = getCurrentUser();
  const [requests, setRequests] = useState(getBloodRequests());
  const donors = getDonors();

  // Find donor record for current user
  const myDonor = donors.find(d => d.userId === user?.id || d.name === user?.name);
  const isAvailable = myDonor ? isDonorAvailable(myDonor) : true;
  const blockedDays = myDonor ? getBlockedDaysRemaining(myDonor) : 0;

  // Only show requests sent TO this donor
  const myRequests = requests.filter(r => {
    if (myDonor) return r.donorId === myDonor.id;
    return false;
  });

  const pendingRequests = myRequests.filter(r => r.status === "pending");
  const pastRequests = myRequests.filter(r => r.status !== "pending");

  const handleAccept = (requestId: string) => {
    acceptRequest(requestId);
    setRequests(getBloodRequests());
    toast.success("Request accepted! You are now blocked for 60 days.");
  };

  const handleReject = (requestId: string) => {
    rejectRequest(requestId);
    setRequests(getBloodRequests());
    toast.info("Request rejected.");
  };

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Donor Dashboard</h1>
      </div>

      {/* Block status */}
      {myDonor && !isAvailable && blockedDays > 0 && (
        <div className="mb-6 bg-accent border border-primary/20 rounded-lg p-4 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">
              Blocked until: {new Date(myDonor.blockedUntil!).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm text-muted-foreground">Available in {blockedDays} days</p>
          </div>
        </div>
      )}

      {isAvailable && myDonor && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="font-medium text-green-800">You are currently available for donation</p>
        </div>
      )}

      {/* Pending requests */}
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4" />
        New Requests ({pendingRequests.length})
      </h2>

      {pendingRequests.length === 0 ? (
        <div className="bg-muted border rounded-lg p-6 text-center mb-8">
          <p className="text-muted-foreground">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {pendingRequests.map(req => (
            <div key={req.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="font-bold">{req.bloodGroup}</Badge>
                    <Badge variant={req.urgency === "critical" ? "destructive" : "secondary"}>
                      {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1">From: {req.recipientName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {req.hospitalAddress}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(req.id)}
                  disabled={!isAvailable}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(req.id)}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" /> Reject
                </Button>
              </div>
              {!isAvailable && (
                <p className="text-xs text-destructive mt-2">You are currently blocked. Cannot accept new requests.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">Past Requests</h2>
          <div className="space-y-3">
            {pastRequests.map(req => (
              <div key={req.id} className="bg-card border rounded-lg p-4 opacity-75">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="font-bold">{req.bloodGroup}</Badge>
                      {req.status === "accepted" ? (
                        <Badge className="bg-green-600 text-primary-foreground">Accepted ✅</Badge>
                      ) : (
                        <Badge variant="secondary">Rejected ❌</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-1">From: {req.recipientName}</p>
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
        </>
      )}

      {!myDonor && (
        <div className="bg-muted border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">You are not registered as a donor yet. Please add yourself from the <strong>Add Donor</strong> page.</p>
        </div>
      )}
    </div>
  );
}
