# ⚡ SHOWPASS

> **Your event. Your crowd. Your moment.**

India's smartest event ticketing platform — built for college fests, concerts, workshops, and everything in between. AI-powered descriptions, dynamic ticket designs, real-time QR check-in, and a full organiser dashboard. Built for DevFusion 2.0 Hackathon.

---

## ✨ What makes it different

| Feature | How it works |
|---|---|
| **Dynamic ticket themes** | Every event category generates a unique ticket design (8 themes) — concerts get Neon Rave, hackathons get Terminal Green, VIP gets Black Card |
| **AI description writer** | Organiser types 5 bullet points → AI writes a polished 3-paragraph description in 3 seconds |
| **Smart AI fallback** | Gemini → Groq → OpenRouter chain — 16,000 free AI requests/day, ₹0 cost |
| **Live QR check-in** | JWT-signed QR codes, idempotent scan validation, live counter updates |
| **Real-time dashboard** | Revenue chart, tier breakdown, attendee table, CSV export |
| **3% commission model** | Built-in platform fee — earning starts from ticket 1 |

---

## 🖥️ Screenshots

```
Landing → Event Detail → Ticket Reveal (confetti) → My Tickets → Dashboard
```

| Page | What you'll see |
|---|---|
| `/` | Dark hero, floating event cards, ticket showcase |
| `/events` | Filter by category, city, price — live search |
| `/events/[slug]` | Full detail, Leaflet map, tier selector, reviews |
| `/checkout` | Razorpay sandbox, discount codes, attendee form |
| `/my-tickets` | Themed ticket stubs with QR codes |
| `/dashboard` | Revenue chart, KPIs, recent orders, upcoming events |
| `/dashboard/events/new` | 4-step event wizard with AI description |
| `/dashboard/checkin/[id]` | Live check-in panel — paste/scan QR |
| `/admin` | Approve events, manage refunds, platform stats |

---

## 🚀 Quick start

### 1. Clone & install

```bash
git clone https://github.com/yourname/showpass.git
cd showpass
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in your `.env` — all services are **free tier**:

| Service | Where to get it | Free limit |
|---|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) | 0.5 GB |
| `GOOGLE_CLIENT_ID/SECRET` | [console.cloud.google.com](https://console.cloud.google.com) | Unlimited |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) | 25 GB |
| `RAZORPAY_*` | [razorpay.com](https://razorpay.com) → Test mode | Unlimited sandbox |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | 1,500 req/day |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | 14,400 req/day |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | Free models |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | 3,000 emails/month |

### 3. Set up database

```bash
npx prisma db push
npm run db:seed
```

Seed creates **10 realistic events** (NH7 Weekender, React India, IIT-BHU Spardha, etc.) with sold counts, reviews, and discount codes.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo accounts

| Role | Email | Password |
|---|---|---|
| Organiser | `organiser@showpass.demo` | `password123` |
| Attendee | `attendee@showpass.demo` | `password123` |
| Admin | `admin@showpass.demo` | `password123` |

**Razorpay test card:** `4111 1111 1111 1111` · Exp: `12/29` · CVV: `123`

---

## 🏗️ Architecture

```
showpass/
├── app/
│   ├── api/                    # 32 API routes
│   │   ├── auth/               # NextAuth handlers
│   │   ├── events/             # CRUD + filters
│   │   ├── orders/             # Create, verify payment, fetch
│   │   ├── tickets/            # QR check-in, fetch
│   │   ├── ai/                 # 4 AI features
│   │   ├── organiser/          # Dashboard KPIs, attendees, stats
│   │   ├── admin/              # Approve events, refunds
│   │   ├── bookmarks/          # Toggle + list
│   │   ├── reviews/            # CRUD + rating distribution
│   │   ├── discount-codes/     # Validate + manage
│   │   └── upload/             # Cloudinary image upload
│   ├── (public)/               # Landing, events, auth, checkout
│   └── (protected)/            # Dashboard, admin — route-guarded
├── components/
│   ├── tickets/TicketStub.tsx  # 8 dynamic themes
│   ├── tickets/TicketReveal.tsx # Confetti reveal animation
│   ├── dashboard/              # Charts, KPIs, check-in panel
│   ├── events/                 # Cards, filters, tier selector
│   ├── admin/                  # Approval table, refund manager
│   └── shared/                 # Navbar, AI editor, map embed
├── lib/
│   ├── ai-router.ts            # Gemini → Groq → OpenRouter fallback
│   ├── ticket-themes.ts        # 8 unique ticket designs
│   ├── qr.ts                   # JWT signing + QR generation
│   └── auth.ts                 # NextAuth v5 config
└── prisma/
    ├── schema.prisma           # 13 models
    └── seed.ts                 # Rich demo data
```

---

## 🤖 AI Features

All AI runs through a smart fallback router — **no paid usage**:

```
Request → Gemini Flash (15 RPM) → Groq Llama 70B (30 RPM) → OpenRouter Mistral (20 RPM)
```

| Feature | Provider | What it does |
|---|---|---|
| Event description | Gemini | Bullet points → polished copy in 3 tone styles |
| Smart recommendations | Groq | Personalised events based on history + bookmarks |
| Schedule builder | Gemini | Optimal session ordering for multi-track events |
| Feedback summary | Groq | Post-event review analysis with sentiment + suggestions |

---

## 🎟️ Ticket Themes

Each event category auto-assigns a unique visual identity:

| Category | Theme | Visual Style |
|---|---|---|
| 🎵 Music | **Neon Rave** | Dark purple + pink neon, soundwave pattern |
| 🎓 College Fest | **Campus Energy** | Navy + orange, diagonal halftone |
| 💻 Tech | **Terminal Green** | Black + matrix green, circuit grid |
| 🎭 Comedy | **Velvet Stage** | Deep purple + gold, curtain arc |
| 🏋️ Fitness | **Surge** | Dark teal + red, slash triangles |
| 🍽️ Food | **Golden Hour** | Warm cream + terracotta, organic blobs |
| 📚 Workshop | **Deep Focus** | Clean white + blue, dot grid |
| ⚽ Sports | **Game Day** | Dark green + lime, field lines |
| VIP (any) | **Black Card** | Matte black + gold foil shimmer |

---

## 💻 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma |
| Auth | NextAuth v5 (Google + demo credentials) |
| Payments | Razorpay sandbox |
| AI | Google Gemini + Groq + OpenRouter |
| File uploads | Cloudinary |
| Email | Resend |
| Animations | Framer Motion |
| Charts | Recharts |
| Maps | Leaflet.js |
| QR codes | qrcode + jose (JWT signing) |
| State | Zustand (cart) + React Query (server state) |
| Deployment | Vercel |

---

## 💰 Business model

```
Organiser lists event (free)
    ↓
Attendee buys ₹500 ticket
    ↓
SHOWPASS takes 3% = ₹15
    ↓
Organiser receives ₹485
```

**Revenue projection:**
- 1 college × 20 events/year × 300 tickets × ₹300 avg = **₹54,000/year per college**
- 10 colleges = **₹5.4L/year** with zero operational cost

---

## 🚢 Deploy to Vercel

```bash
# Push to GitHub first
git add . && git commit -m "initial commit" && git push

# Then on vercel.com:
# 1. Import repository
# 2. Add all env variables from .env.example
# 3. Deploy
```

After deploy, run seed via Vercel CLI:
```bash
npx vercel env pull .env.local
npm run db:seed
```

---

## 📜 License

built for DevFusion 2.0 Hackathon by the SHOWPASS team.

---

<div align="center">
  <strong>⚡ SHOWPASS</strong> — built to win
</div>