# 🚀 TMD (The Match Date) — Developer & Architecture Guide

Welcome to **The Match Date (TMD)** engineering codebase. This guide is crafted so that any developer with 2–3 years of Next.js, Node.js, and TypeScript experience can onboard within an hour, understand the system architecture, and confidently resolve issues or add features.

---

## 🏗️ 1. Technology Stack

- **Framework**: Next.js 14 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL (Containerized via Docker on Coolify)
- **ORM**: Prisma 5.22.0
- **Styling**: Tailwind CSS + TMD Aura Gold Theme (`#FFC629`, `#F59E0B`, `#0c0c10`, `#121216`)
- **Real-Time & Media**: Server-Sent Events (SSE) & HMAC-SHA256 Signed View-Once Streams
- **Payments**: TMD Merchant UPI (`8817958002@ybl`) with AstroTalk-style direct app intents & QR codes
- **Push & Notifications**: Web Push (`web-push` VAPID) + In-App Notifications + Nodemailer

---

## 📁 2. Codebase Organization

```
d:\MPPSC\
├── prisma/
│   ├── schema.prisma            # Single source of truth for all DB models
│   └── seed.ts                  # Optional seed script
├── src/
│   ├── app/                     # Next.js 14 App Router
│   │   ├── api/                 # Backend REST Route Handlers
│   │   │   ├── auth/            # /send-otp, /verify-otp, /me, /logout
│   │   │   ├── discovery/       # /feed, /swipe, /rewind
│   │   │   ├── chat/            # /conversations, /messages, /view-once
│   │   │   ├── events/          # /events, /[id]/book-ticket, /[id]/attendees
│   │   │   ├── notifications/   # In-app notification polling & push subscription
│   │   │   └── payments/        # /create-order, /verify
│   │   ├── page.tsx             # Home Dating Discovery (Tinder-style swipe deck)
│   │   ├── map/page.tsx         # Events Map (Radars, Mixers, Ticketing & Host Form)
│   │   ├── chat/page.tsx        # Real-time conversations & View-Once photo viewer
│   │   ├── plan/page.tsx        # VIP Membership Plans & UPI Checkout
│   │   └── settings/page.tsx    # User Profile, Photo Reordering, Account Controls
│   ├── components/              # Modular UI Components
│   │   ├── auth/                # AuthModal, MeetupAuthHero, SplashScreen
│   │   ├── discovery/           # DiscoveryCard, SwipeControls, MatchModal
│   │   ├── events/              # EventTicketBookingModal, EventCard
│   │   ├── navigation/          # BottomNav
│   │   └── notifications/       # PushNotificationPrompt, NotificationListener
│   ├── lib/                     # Core Business Logic & Infrastructure
│   │   ├── auth-crypto.ts       # Argon2/Scrypt hashing, JWT tokens
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── email.ts             # Nodemailer wrapper with fallback logging
│   │   ├── push.ts              # Web Push notification dispatcher
│   │   ├── notifications.ts     # In-app notifications service
│   │   ├── session.ts           # HttpOnly secure cookie session manager
│   │   ├── swipe-window.ts      # 12-hour swipe window calculation
│   │   └── view-once.ts         # View-Once single-use cryptographic tokens
│   └── services/                # Reusable Domain Services (Discovery, Matching)
├── scripts/
│   └── swarm-simulation-engine.ts # Pre-launch multi-agent simulation test harness
└── next.config.mjs              # Hardened Security Headers (HSTS, CSP, Permissions)
```

---

## 🔒 3. Core Architectural Invariants

### A. Authentication & Session
- **Zero-Password**: Users authenticate via 6-digit OTP sent to their mobile number.
- **Single-Use OTP**: Hashed using HMAC; invalidated immediately upon verification or after 5 incorrect attempts.
- **Session Tokens**: Signed JWT stored in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie (`tmd_session`).

### B. Swipe Limits & Fixed 12-Hour Windows
- Swiping is rate-limited according to user entitlement plans.
- Windows reset at fixed local times (`00:00` and `12:00` Asia/Kolkata), preventing edge-case abuse.

### C. View-Once Media Privacy & Security
- Ephemeral photos are stored on the server without public web exposure.
- When an attendee opens a view-once media item, the server issues a **60-second HMAC-SHA256 single-use token**.
- Once streamed, the media is marked `isOpened: true` in PostgreSQL and subsequent requests are blocked with HTTP 403.

### D. Event Ticketing & Settlement Flow (BookMyShow Flow)
- **Host Event Creation**: Hosts specify custom venue names, Google Maps URLs, and ticket prices (Male, Female, Couple).
- **Payment Routing**: 100% of pass booking funds route directly to TMD's merchant UPI: `8817958002@ybl`.
- **Commission & Ledger**: TMD collects 7% platform fee + ₹39 convenience fee; the host receives **93% net payout** post-event.
- **Multi-Channel Real-Time Host Notification**:
  - 🔔 In-App Notification (bell badge counter)
  - 📲 Mobile/Web Push Alert via Service Worker
  - ✉️ Transactional Email with breakdown receipt

### E. Google OAuth 2.0 Integration
- **Routes**: `/api/auth/google` (initiation) & `/api/auth/google/callback` (token exchange & user upsert).
- **Required Env Variables**:
  - `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID from Google Cloud Console.
  - `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret from Google Cloud Console.
- **Authorized Redirect URI in Google Cloud Console**:
  - `https://tmd.dizitio.com/api/auth/google/callback` (Production)
  - `http://localhost:3000/api/auth/google/callback` (Local Development)

---

## 🛠️ 4. Quick Developer Commands

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Synchronize Prisma Schema with local database
npx prisma db push

# 3. Start local development server
npm run dev

# 4. Typecheck codebase
npx tsc --noEmit
```

### Running the Multi-Agent Simulation Harness
To verify all systems end-to-end (Agent spawning, matching, concurrent chat, event creation, ticket purchases, host notifications):
```bash
npx tsx scripts/swarm-simulation-engine.ts
```

---

## 🚢 5. Production Deployment

TMD is deployed via **Coolify** on Docker:
- Application Container: Next.js standalone runner on port 3000.
- Database Container: PostgreSQL 16 (`g1ivkrueeukztmilgophu9an`).
- Domain: `https://tmd.dizitio.com` (proxied via Caddy with automated SSL).

Whenever code is pushed to `main` and `master`, Coolify builds and replaces the running container without downtime.
