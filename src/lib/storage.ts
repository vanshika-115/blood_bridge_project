export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  district: string;
  contact: string;
  password: string;
  role: "donor" | "recipient";
}

export interface Donor {
  id: string;
  userId?: string;
  name: string;
  bloodGroup: string;
  contact: string;
  address: string;
  district: string;
  available: boolean;
  donations: number;
  lastDonationDate?: string;
  blockedUntil?: string;
  lat?: number;
  lng?: number;
}

export interface BloodRequest {
  id: string;
  donorId: string;
  recipientId: string;
  recipientName: string;
  donorName: string;
  bloodGroup: string;
  hospitalAddress: string;
  district: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  requesterName?: string;
}

const USERS_KEY = "bloodbridge_users";
const CURRENT_USER_KEY = "bloodbridge_current_user";
const DONORS_KEY = "bloodbridge_donors";
const REQUESTS_KEY = "bloodbridge_requests";

// Users
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
export function getCurrentUser(): User | null {
  const u = localStorage.getItem(CURRENT_USER_KEY);
  return u ? JSON.parse(u) : null;
}
export function setCurrentUser(user: User | null) {
  if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(CURRENT_USER_KEY);
}

// Donors
export function getDonors(): Donor[] {
  return JSON.parse(localStorage.getItem(DONORS_KEY) || "[]");
}
export function saveDonors(donors: Donor[]) {
  localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
}

// Blood Requests
export function getBloodRequests(): BloodRequest[] {
  return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
}
export function saveBloodRequests(requests: BloodRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

// 60-day blocking logic
export function isDonorAvailable(donor: Donor): boolean {
  // Check blockedUntil first
  if (donor.blockedUntil) {
    const blockedUntil = new Date(donor.blockedUntil);
    const now = new Date();
    if (now < blockedUntil) return false;
  }
  // Legacy: check lastDonationDate (56-day cooldown)
  if (donor.lastDonationDate) {
    const lastDonation = new Date(donor.lastDonationDate);
    const now = new Date();
    const daysSince = (now.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 60) return false;
  }
  return donor.available;
}

// Get remaining blocked days
export function getBlockedDaysRemaining(donor: Donor): number {
  if (!donor.blockedUntil) return 0;
  const blockedUntil = new Date(donor.blockedUntil);
  const now = new Date();
  const diff = blockedUntil.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Accept a blood request: block donor for 60 days
export function acceptRequest(requestId: string): void {
  const requests = getBloodRequests();
  const donors = getDonors();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) return;

  requests[reqIndex].status = "accepted";

  // Block the donor for 60 days
  const donorIndex = donors.findIndex(d => d.id === requests[reqIndex].donorId);
  if (donorIndex !== -1) {
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + 60);
    donors[donorIndex].available = false;
    donors[donorIndex].blockedUntil = blockedUntil.toISOString();
    donors[donorIndex].lastDonationDate = new Date().toISOString();
    donors[donorIndex].donations = (donors[donorIndex].donations || 0) + 1;
    saveDonors(donors);
  }

  // Reject all other pending requests to this donor
  requests.forEach((r, i) => {
    if (i !== reqIndex && r.donorId === requests[reqIndex].donorId && r.status === "pending") {
      requests[i].status = "rejected";
    }
  });

  saveBloodRequests(requests);
}

// Reject a blood request
export function rejectRequest(requestId: string): void {
  const requests = getBloodRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) return;
  requests[reqIndex].status = "rejected";
  saveBloodRequests(requests);
}

// Extract district from address string
export function extractDistrict(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[0].toLowerCase();
  }
  return parts[0]?.toLowerCase() || "";
}

// Match donors strictly: BOTH blood group AND district must match, and donor must be available
export function matchDonors(bloodGroup: string, district: string): { available: Donor[]; unavailable: Donor[] } {
  const allDonors = getDonors();
  const districtLower = district.toLowerCase().trim();

  const available: Donor[] = [];
  const unavailable: Donor[] = [];

  allDonors.forEach(d => {
    const donorDistrict = (d.district || extractDistrict(d.address)).toLowerCase().trim();
    const bloodMatch = d.bloodGroup === bloodGroup;
    const districtMatch = districtLower && donorDistrict && (
      donorDistrict.includes(districtLower) || districtLower.includes(donorDistrict)
    );

    if (bloodMatch && districtMatch) {
      if (isDonorAvailable(d)) available.push(d);
      else unavailable.push(d);
    }
  });

  return { available, unavailable };
}

// Seed some initial donors only once
const SEEDED_KEY = "bloodbridge_seeded";

export function seedData() {
  if (localStorage.getItem(SEEDED_KEY)) return;
  if (getDonors().length === 0) {
    const sampleDonors: Donor[] = [
      { id: "1", name: "Rahul Sharma", bloodGroup: "O+", contact: "9876543210", address: "Sector 15, Noida, UP", district: "noida", available: true, donations: 5, lat: 28.5855, lng: 77.3100 },
      { id: "2", name: "Priya Singh", bloodGroup: "A+", contact: "9876543211", address: "Connaught Place, New Delhi", district: "new delhi", available: true, donations: 3, lat: 28.6315, lng: 77.2167 },
      { id: "3", name: "Amit Kumar", bloodGroup: "B+", contact: "9876543212", address: "MG Road, Bangalore", district: "bangalore", available: true, donations: 8, lat: 12.9716, lng: 77.5946 },
      { id: "4", name: "Sneha Patel", bloodGroup: "AB+", contact: "9876543213", address: "Andheri West, Mumbai", district: "mumbai", available: false, donations: 2, lastDonationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), lat: 19.1364, lng: 72.8296 },
      { id: "5", name: "Vikram Reddy", bloodGroup: "O-", contact: "9876543214", address: "Banjara Hills, Hyderabad", district: "hyderabad", available: true, donations: 12, lat: 17.4106, lng: 78.4408 },
      { id: "6", name: "Anjali Gupta", bloodGroup: "A-", contact: "9876543215", address: "Salt Lake, Kolkata", district: "kolkata", available: true, donations: 1, lat: 22.5800, lng: 88.4150 },
    ];
    saveDonors(sampleDonors);
  }
  localStorage.setItem(SEEDED_KEY, "true");
}
