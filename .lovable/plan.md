## Plan

1. **Update storage.ts** - Add role to User, add BloodRequest with donorId/recipientId/status, add blockedUntil to Donor, update availability logic for 60-day blocking

2. **Update Login.tsx** - Add role selection (Donor/Recipient) on signup

3. **Update Navbar.tsx** - Show role-appropriate navigation (donors see Dashboard, recipients see Request Blood)

4. **Create DonorDashboard.tsx** - Show requests sent to logged-in donor with Accept/Reject buttons

5. **Update BloodRequest.tsx** - Recipients can send requests to specific donors, see their request statuses

6. **Update DonorList.tsx** - Only show available donors (respect blockedUntil), show block status for unavailable

7. **Update App.tsx** - Add DonorDashboard route

8. **Update Home.tsx** - Show role-appropriate quick links
