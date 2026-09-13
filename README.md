# Wealthify — AI-Powered Personal Finance Manager

> Take full control of your finances with AI-driven insights, budget tracking, and smart transaction management.

---

## Overview

**Wealthify** is a full-stack personal finance web application built with **Next.js 15**. It lets users manage multiple bank accounts, track income and expenses, set monthly budgets, and receive AI-powered financial insights — all from a single dashboard.

---

## Features

- 🏦 **Multi-Account Management** — Create and manage Savings & Current accounts with real-time balance tracking
- 💸 **Transaction Tracking** — Log income and expenses with categories, dates, and optional receipt uploads
- 🔁 **Recurring Transactions** — Set transactions to repeat daily, weekly, monthly, or yearly — processed automatically via background jobs
- 📊 **Dashboard & Charts** — Visual overview of spending patterns using interactive Recharts graphs
- 🤖 **AI Financial Insights** — Powered by Google Gemini, get smart summaries and advice on your spending habits
- 🎯 **Budget Management** — Set monthly budgets and get email alerts when approaching or exceeding limits
- 📧 **Email Notifications** — Automated budget alert emails sent via Resend using React Email templates
- 🔒 **Authentication & Security** — Clerk-powered auth with Arcjet rate limiting and bot protection
- 🌙 **Dark / Light Mode** — Theme toggle via `next-themes`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui (Radix UI) |
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
| **Auth** | Clerk |
| **AI** | Google Gemini (`@google/generative-ai`) |
| **Background Jobs** | Inngest |
| **Email** | Resend + React Email |
| **Security** | Arcjet (rate limiting, bot detection) |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign-in / Sign-up pages
│   ├── (main)/
│   │   ├── dashboard/   # Main dashboard page
│   │   ├── account/     # Account detail pages
│   │   └── transaction/ # Transaction creation/editing
│   ├── api/
│   │   ├── inngest/     # Inngest background job handler
│   │   └── seed/        # DB seeding endpoint
│   └── page.tsx         # Landing page
├── actions/             # Next.js Server Actions
│   ├── account.ts       # Account CRUD
│   ├── budget.ts        # Budget management
│   ├── dashboard.ts     # Dashboard data fetching
│   ├── transactions.ts  # Transaction CRUD + AI scanning
│   └── send-email.ts    # Email sending
├── components/          # Reusable UI components
├── data/                # Static data (features, testimonials, etc.)
├── emails/              # React Email templates
├── hooks/               # Custom React hooks
├── lib/                 # Prisma client, utils, Inngest config
└── types/               # TypeScript type definitions
```

---

## Database Schema

| Model | Description |
|---|---|
| `User` | Linked to Clerk, owns accounts, transactions, budgets |
| `Account` | Bank account (Savings / Current) with balance |
| `Transaction` | Income or expense entry with optional recurring schedule |
| `Budget` | Monthly spending limit per user with alert tracking |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Accounts for: Clerk, Resend, Arcjet, Google AI Studio, Inngest

### 1. Clone and Install

```bash
git clone https://github.com/TheMercury1229/ai-finance-app.git
cd ai-finance-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=sign-up

# Database (Supabase / PostgreSQL)
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Security
ARCJET_KEY=

# Email
RESEND_API_KEY=

# AI
GEMINI_KEY=
```

### 3. Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the Development Server

```bash
npm run dev
```

App is available at [http://localhost:3000](http://localhost:3000).

### 5. Preview Emails (Optional)

```bash
npm run email
```

---

## Background Jobs (Inngest)

Wealthify uses **Inngest** for scheduled background processing:

- **Recurring Transactions** — Automatically creates new transaction entries on the due date based on each transaction's recurring interval.
- **Budget Alerts** — Checks monthly spending against the user's budget and sends an alert email when the threshold is exceeded.

To run Inngest locally, follow the [Inngest Dev Server docs](https://www.inngest.com/docs/local-development).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run email` | Preview email templates |

---

## License

This project is for personal/educational use. Feel free to fork and adapt.
