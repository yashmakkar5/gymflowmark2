# GymFlow — Multi-Tenant Gym Management SaaS

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-orange.svg)](#architecture--security)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2F%20Mongoose-brightgreen.svg)](https://mongoosejs.com/)

A modern, high-performance gym management platform designed to replace bloated legacy software with a fast, dark-first operational desk. Built with **Node.js, Express, MongoDB, JWT, Multer, and Vanilla ES6**.

---

## 📌 Why GymFlow Was Built

Most gym management systems today suffer from three problems:
1. **Clunky legacy software**: Built in the late 2000s, overloaded with unnecessary tabs, slow load times, and poor UX.
2. **Peak-hour bottlenecks**: During morning (7–9 AM) and evening (6–8 PM) rushes, front-desk staff need to check in arriving members in under 2 seconds. Multi-page navigation causes front-desk queues.
3. **Fragmented billing & compliance**: Tracking renewals on WhatsApp and messy spreadsheets leads to revenue leakage and manual GST invoice calculations.

**GymFlow** was engineered from the ground up to solve these pain points:
- **Fast Attendance Desk**: Autocomplete lookup with 1-click toggle (`< 2s` check-in/out).
- **Automated Billing Engine**: 18% inclusive GST calculation and printable, compliant tax receipts.
- **Enterprise Multi-Tenancy**: Logical database separation ensuring complete data isolation between gym tenants.
- **High-Density, Dark-First Interface**: Clean typography, 1px zinc borders, and zero gratuitous gradients—built for staff who spend 8+ hours in the dashboard.

---

## 🏗️ Architecture & Engineering Highlights

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA Architecture)                     │
│    Vanilla ES6 Modules • Custom CSS System • Zero Third-Party Bloat    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP Requests (Bearer JWT / Multipart)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS BACKEND PIPELINE                        │
│  ├── CORS & JSON Body Parser                                           │
│  ├── Static File Hosting (/uploads/avatars, SPA Assets)                │
│  ├── JWT Authentication & Tenant Scoping Guard (req.user.gymId)        │
│  ├── Multer File Upload Stream (MIME whitelist, 5MB ceiling)           │
│  └── Modular REST Routers (Members, Attendance, Payments, Plans)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Strictly Scoped Mongoose Queries
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MONGODB DATA LAYER                              │
│  ├── Gym Tenants (Profiles, Settings, Turnstile Rules)                 │
│  ├── Users & Staff (bcrypt Salt-Hashed Passwords, RBAC)                │
│  ├── Members CRM (Compound Indexed: { gymId: 1, phone: 1 })            │
│  └── Attendance & Payments (Sub-5ms Lookups, Aggregation Pipelines)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Multi-Tenant Security by Design
GymFlow uses a **shared-database, shared-schema** multi-tenant model with strict logical data isolation:
- The backend **never trusts client-supplied tenant identifiers** (e.g. `req.body.gymId` or query params).
- The authenticated user's `gymId` is extracted directly from the cryptographically signed JWT payload in `backend/middleware/auth.js`.
- Every database query is strictly scoped to `req.user.gymId`. An automated test suite verifies that Gym 2 (`rohan@crossfitelevate.in`) cannot read or mutate records belonging to Gym 1 (`vikram@ironhouse.in`).

### 2. Multer Multipart Upload Pipeline
- Integrated in `backend/middleware/upload.js` for member photo verification and staff profiles.
- Validates binary stream MIME types (whitelist: JPEG, PNG, WebP) and caps sizes at 5MB to prevent DoS storage exhaustion.
- Generates collision-free disk filenames using timestamp hashes (`avatar-${Date.now()}-${random}.png`).

### 3. Deliberate Frontend Decisions: Why Vanilla ES6?
- **Zero build toolchain overhead**: No webpack, Vite, or Babel required to run or evaluate the project. Instant clone-and-run experience.
- **Sub-50ms render latency**: Direct DOM manipulation without virtual DOM reconciliation overhead.
- **Custom SVG Data Visualizations**: Pure SVG revenue trajectories and attendance bar charts—no 500KB chart library bundles.

### 4. Dual-Mode Database Resilience
- `backend/config/db.js` connects to any production MongoDB cluster via `MONGODB_URI`.
- If no external database is configured, it automatically spins up an embedded in-memory MongoDB instance (`mongodb-memory-server`) pre-loaded with realistic seed data. Anyone can test the application with **zero local database setup**.

---

## ⚡ Core Operational Features

| Feature | Operational Capability | Implementation Details |
|---|---|---|
| **Executive Dashboard** | Real-time overview of active members, revenue, turnstile traffic, and churn risk. | Time-aware greeting, SVG revenue curves, 1-click renewal quick-actions. |
| **Members Directory & CRM** | Complete member profiles, attendance histories, emergency contacts, and medical notes. | High-density data table, live debounced search, status filter pills (*Active, Expiring, Expired*). |
| **Fast Attendance Desk** | Turnstile speed check-in/out for front-desk staff. | Sub-2s lookups via compound index `{ gymId: 1, date: 1, memberId: 1 }`, live occupancy counter. |
| **Billing & 18% GST Invoices** | Financial transaction ledger and compliant tax invoices. | Inclusive GST calculation, UPI/Cash/Card ledger, browser-printable receipt modal. |
| **Tier & Plan Admin** | Flexible membership tiers (Monthly, Quarterly, Annual Pro). | Active subscriber count tracking, feature flags, self-serve plan creation. |
| **Trainers & Classes** | Coach rosters and group workout session scheduling. | Shift schedules, capacity meters, real-time seat reservation & cancellation. |
| **Business Intelligence** | Executive unit economics and retention analytics. | Monthly retention rates, payment channel distribution, 1-click CSV export. |
| **Command Palette (`Ctrl + K`)** | Global keyboard-driven navigation across screens and members. | Custom modal overlay with hotkey listeners and instant member search. |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (bundled with Node)

### 1. Clone & Install
```bash
git clone https://github.com/yashmakkar5/gymflowmark2.git
cd gymflowmark2
npm install
```

### 2. Run the Application
```bash
npm start
```
The server will start at: **`http://localhost:5000`**

### 3. Demo Credentials
The database automatically seeds realistic Indian gym data on startup:

| Role | Gym / Tenant | Email | Password |
|---|---|---|---|
| **Gym Owner** | Iron House Fitness (Mumbai) | `vikram@ironhouse.in` | `admin123` |
| **Front Desk** | Iron House Fitness (Mumbai) | `pooja@ironhouse.in` | `staff123` |
| **Multi-Tenant Test** | CrossFit Elevate (Bengaluru) | `rohan@crossfitelevate.in` | `admin123` |

*(Tip: Click the **"Use Demo"** button on the login screen for 1-click sign in)*

---

## 🧪 Automated Testing

GymFlow includes an end-to-end integration test suite verifying authentication, multi-tenancy isolation, database queries, and Multer file uploads:

```bash
npm test
```

### Test Suite Execution Output:
```text
🧪 Starting GymFlow Automated API Verification...

1. Testing /api/health ...
   ✅ Health check passed.
2. Testing /api/auth/login (Iron House Fitness) ...
   ✅ Authentication successful. Received Bearer token.
3. Testing Multi-Tenant Data Isolation ...
   ✅ Tenant isolation verified: Gym 1 has 16 members, Gym 2 has 0 members.
4. Testing /api/dashboard ...
   ✅ Dashboard stats loaded. Monthly Revenue: ₹1,499
5. Testing Member Creation & Profile ...
   ✅ Member created: Sunil Gavaskar
   ✅ Member profile CRM loaded with attendance and payment history.
5b. Testing Multer Member Avatar Upload (/api/members/:id/avatar) ...
   ✅ Multer image upload verified: /uploads/avatars/avatar-xxx.png
6. Testing /api/attendance/toggle ...
   ✅ Member fast checked in.
   ✅ Member fast checked out.
7. Testing /api/payments and receipt generator ...
   ✅ Tax invoice receipt verified with GST breakdown.
8. Testing Plans, Trainers, Classes, and Executive Reports ...
   ✅ All administrative modules responding with 200 OK.

🎉 ALL GYMFLOW TESTS PASSED SUCCESSFULLY! Ready for production deployment.
```

---

## 📂 Project Structure

```text
gymflow/
├── backend/
│   ├── server.js               # Express application configuration & route mounting
│   ├── config/
│   │   ├── db.js               # Database connection (URI + In-Memory fallback)
│   │   └── seed.js             # Realistic 16-member Indian seed dataset
│   ├── models/                 # Mongoose schemas (Gym, User, Member, Plan, Payment, Attendance, etc.)
│   ├── controllers/            # Core business logic & financial calculations
│   ├── routes/                 # REST endpoints with auth protection
│   ├── middleware/
│   │   ├── auth.js             # JWT verification & tenant scoping
│   │   └── upload.js           # Multer multipart file upload handling
│   └── test/
│       └── api.test.js         # Automated end-to-end integration test suite
├── frontend/
│   ├── index.html              # Clean Single Page Application entry
│   ├── css/
│   │   └── styles.css          # Design system (#09090B, 1px zinc borders, electric lime)
│   └── js/
│       ├── app.js              # SPA router, shell orchestrator, and Ctrl+K Command Palette
│       ├── api.js              # Fetch client with auto JWT header injection
│       ├── state.js            # Reactive application state store
│       ├── components/         # Reusable modals, toasts, SVG charts, and icons
│       └── views/              # Modular view renderers (Dashboard, Members, Attendance, etc.)
├── uploads/
│   └── avatars/                # Multer disk storage destination
└── package.json
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
