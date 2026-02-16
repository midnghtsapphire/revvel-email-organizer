# Revvel Email Organizer

**The neurodivergent-first email organizer that transforms inbox chaos into calm, focused productivity.**

Revvel introduces the **Compass Dashboard** — a revolutionary approach to email management featuring Inbox Weather, Relational Sonar, Commitment Tracker, Energy Matching, and Decision Fatigue Guard.

---

## Features

### Compass Dashboard
- **Inbox Weather** — Visual metaphor for inbox state (Sunny, Cloudy, Stormy, Hurricane)
- **Relational Sonar** — Track relationship health with contacts over time
- **Commitment Tracker** — AI-extracted promises and deadlines from emails
- **Energy Matching** — Suggests optimal email tasks based on your current energy level
- **Decision Fatigue Guard** — Limits daily decisions to prevent cognitive overload

### Accessibility (Audrey's UX Principles)
- **ECO CODE** — CO₂ impact metrics translated to relatable units (tacos, lattes, gas tanks)
- **NEURO CODE** — ADHD-optimized mode with reduced animations, larger targets, focus mode
- **DYSLEXIC MODE** — OpenDyslexic font, increased spacing, high contrast

### UX Design Principles
- **Calm Entry** — Maximum 2 buttons on the first screen
- **One Path to One Place** — Each button leads to exactly one destination
- **Step by Step** — Wizard flows for complex tasks
- **Label Everything** — Text + icon on every interactive element
- **Button-Label Pattern** — Consistent button styling throughout

### AI-Powered Features
- Email summarization via Claude Sonnet 4.5 (OpenRouter)
- Smart email categorization
- Commitment extraction from email text
- AI-assisted reply drafting
- Full AI attribution tracking

### Integrations
- **Gmail API** — Real OAuth integration (with demo mode fallback)
- **Stripe** — Subscription billing ($0 Free / $15 Pro / $25 Team)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Express 4, tRPC 11, TypeScript |
| Database | MySQL / TiDB (via Drizzle ORM) |
| AI | OpenRouter API → Claude Sonnet 4.5 |
| Email | Gmail API (OAuth 2.0) |
| Billing | Stripe |
| Testing | Vitest |
| CI/CD | GitHub Actions |
| Container | Docker, Docker Compose |

---

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL 8+ (or use Docker Compose)

### 1. Clone & Install

```bash
git clone https://github.com/MIDNGHTSAPPHIRE/revvel-email-organizer.git
cd revvel-email-organizer
pnpm install
```

### 2. Environment Setup

```bash
# Copy the test environment template
cp .env.test .env

# Edit .env with your values (see comments in file for guidance)
# At minimum, set:
#   DATABASE_URL
#   JWT_SECRET
#   OPENROUTER_API_KEY
```

### 3. Database Setup

```bash
# Option A: Using Docker Compose (recommended)
docker compose up -d db

# Option B: Use your own MySQL instance
# Update DATABASE_URL in .env

# Push schema
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
# Server starts at http://localhost:3000
```

### 5. Run Tests

```bash
pnpm test
```

---

## Docker Deployment

```bash
# Start all services (app + MySQL + Redis)
docker compose up -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features |

### Optional (Gmail Integration)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

> **Demo Mode:** The app runs without Google credentials. Gmail features show demo data. Set credentials to enable real Gmail integration.

### Optional (Stripe Billing)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan ($15/mo) |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for Team plan ($25/mo) |

---

## Project Structure

```
revvel-email-organizer/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── compass/       # Compass Dashboard widgets
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── AccessibilityBar.tsx
│   │   │   └── DecisionFatigueGuard.tsx
│   │   ├── contexts/          # React contexts
│   │   │   ├── AccessibilityContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/             # Page components
│   │   │   ├── Home.tsx       # Landing page (Calm Entry)
│   │   │   ├── CompassDashboard.tsx
│   │   │   ├── Inbox.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── FossCredits.tsx
│   │   ├── App.tsx            # Routes & layout
│   │   └── index.css          # Theme & global styles
│   └── index.html
├── server/                    # Express backend
│   ├── services/
│   │   ├── openrouter.ts      # OpenRouter AI integration
│   │   ├── gmail.ts           # Gmail OAuth service
│   │   ├── openrouter.test.ts
│   │   └── gmail.test.ts
│   ├── _core/                 # Framework plumbing
│   ├── db.ts                  # Database queries
│   ├── routers.ts             # tRPC procedures
│   ├── routers.test.ts
│   └── storage.ts             # S3 file storage
├── drizzle/                   # Database schema & migrations
│   └── schema.ts
├── shared/                    # Shared types & constants
├── .github/workflows/         # CI/CD
│   └── ci.yml
├── .env.test                  # Test environment template
├── .env.production            # Production environment template
├── AI_ATTRIBUTION.md          # AI model tracking
├── Dockerfile                 # Production container
├── docker-compose.yml         # Local dev environment
└── README.md
```

---

## Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | Basic inbox, 50 AI actions/day, 1 Gmail account |
| **Pro** | $15/mo | Compass Dashboard, unlimited AI, 3 Gmail accounts, ECO/NEURO/DYSLEXIC modes |
| **Team** | $25/user/mo | Everything in Pro + team inbox, shared labels, admin controls, priority support |

---

## AI Attribution

Revvel tracks which AI models generate which parts of the code and runtime operations. See [AI_ATTRIBUTION.md](./AI_ATTRIBUTION.md) for full details.

Runtime AI usage is logged to the `ai_attribution` database table and accessible via the admin dashboard.

---

## Accessibility

Revvel is designed with WCAG AAA compliance in mind:

- **Zero blue light** — Earthy dark theme with warm tones only
- **ECO CODE** — Environmental impact awareness with relatable metrics
- **NEURO CODE** — ADHD-optimized interface with reduced cognitive load
- **DYSLEXIC MODE** — OpenDyslexic font with increased letter/word spacing
- **Keyboard navigation** — Full keyboard accessibility
- **Screen reader support** — ARIA labels on all interactive elements
- **High contrast** — 7:1+ contrast ratios

---

## FOSS Credits

Revvel is built on the shoulders of open source. See the in-app FOSS Credits page for full attribution to all libraries and tools used.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

All PRs are reviewed by [CodeRabbit](https://coderabbit.ai/) (connected to this repo).

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built with care by the Revvel team. Designed for neurodivergent minds, loved by everyone.*
