# GymFlow — Premium Gym Management SaaS

GymFlow is a commercial-grade, multi-tenant gym management SaaS platform built with a high-craft dark-first design system inspired by **Linear, Stripe, Vercel, and Apple**.

Designed for real gym owners with realistic Indian business context (Indian Rupee `₹`, GST tax invoices, realistic member rosters, front-desk attendance, and multi-tenant security).

---

## 🚀 Quick Start

### 1. Start Server
```bash
npm start
```
The server will start at: **`http://localhost:5000`**

### 2. Demo Credentials
- **Gym**: Iron House Fitness (Mumbai)
- **Email**: `vikram@ironhouse.in`
- **Password**: `admin123`
*(A second demo gym `rohan@crossfitelevate.in` is also seeded to test multi-tenant data isolation)*

### 3. Run Automated Tests
```bash
npm test
```

---

## 🎨 Visual Direction & Aesthetics
- **Theme**: Dark-first near-black palette
  - Background: `#09090B`
  - Surface: `#111113`
  - Elevated Surface: `#18181B`
  - Crisp Borders: `#27272A`
  - Strategic Accent: Electric Lime (`#10E57A`) used sparingly for CTAs, active states, and metrics.
- **Typography**: Inter with tabular numbers (`font-variant-numeric: tabular-nums`) for currency and metrics.
- **Micro-Interactions**: Subtle 150ms transitions, clean toast notifications, dialog modals with ESC / click-outside dismissal, and pure SVG charts (zero third-party bloat).

---

## ⚡ Core Features

1. **Dashboard**:
   - Time-aware greeting: *"Good morning / afternoon / evening, Vikram"*
   - KPI metrics: Active Members, Today's Attendance, Monthly Revenue, Expiring Memberships.
   - Interactive SVG Revenue trajectory chart and attendance distribution.
   - Live activity feed & expiring memberships with 1-click renewal.
   - Operational Quick Actions bar.

2. **Members Directory & CRM**:
   - High-density data table with live search and status filters (*All, Active, Expiring Soon, Expired*).
   - Structured Add Member modal (Personal info, Contact/Emergency, Membership plan, Upfront fee collection).
   - Comprehensive Member CRM Profile with 4 tabs:
     - **Overview**: Personal info, plan duration, emergency contacts, notes.
     - **Attendance**: 30-day check-in log and monthly presence score.
     - **Payments**: Transaction history and invoice view.
     - **Membership History**: Renewal audit log.

3. **Fast Attendance Desk**:
   - Designed for front-desk speed (< 2 seconds per check-in).
   - Instant search autocomplete and 1-click check-in/out toggle.
   - Real-time indicator of members currently on the gym floor.

4. **Plans Management**:
   - Admin tier cards showing pricing, duration, active subscriber counts, and features.
   - Create, edit, and archive plans.

5. **Billing & Payments**:
   - Real-time financial ledger (UPI, Cash, Card, NetBanking).
   - Monthly and daily collection metrics.
   - Printable official GST Tax Invoice generator with gym details and 18% GST breakdown.

6. **Trainers & Staff**:
   - Roster of coaches, specializations, shift schedules, and assigned trainees.

7. **Classes & Group Workouts**:
   - Schedule classes (HIIT, Yoga, Strength WOD, CrossFit) with real-time seat booking and capacity meters.

8. **Executive Reports**:
   - Unit economics, retention rates, payment channel distribution, and 1-click CSV export.

9. **Settings & Multi-Tenant Security**:
   - Gym profile, GSTIN configuration, staff user management, and grace period rules.
   - Strict tenant isolation: every query is scoped to `req.user.gymId`.

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js, Mongoose, JWT, bcryptjs.
- **Database**: Zero-setup embedded `mongodb-memory-server` fallback, with instant connection to `MONGODB_URI` when provided in `.env`.
- **Frontend**: Vanilla ES Modules + Custom CSS Design System (zero build overhead, instant load).
