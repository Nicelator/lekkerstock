# Lekkerstock — Developer Setup Guide

## Stack
- **Frontend/API:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth:** Better Auth
- **Database + Storage:** Supabase (Postgres + Storage Buckets)
- **Payments:** Paystack (NGN + USD, subscriptions + one-time)
- **Email:** Resend
- **Analytics:** PostHog
- **Deployment:** Vercel

---

## 1. Prerequisites

```bash
node --version   # need v18+
npm --version    # need v9+
```

---

## 2. Clone & Install

```bash
# Install dependencies
cd lekkerstock
npm install
```

---

## 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **API keys** (Settings → API)
3. Note your **Database connection string** (Settings → Database → Connection string → URI)
4. Go to **SQL Editor** → New Query
5. Paste the entire contents of `supabase/schema.sql` and run it
6. Go to **Storage** → check that 3 buckets were created: `assets`, `previews`, `avatars`

---

## 4. Better Auth Setup

Generate a secret:
```bash
openssl rand -base64 32
```
Copy the output — use it as `BETTER_AUTH_SECRET`.

---

## 5. Paystack Setup

1. Go to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Settings → API Keys → copy **Test** keys first (switch to Live when ready)
3. Create 3 subscription plans (Products → Plans):
   - **Buyer Pro USD** — $39/month (interval: monthly)
   - **Buyer Pro NGN** — ₦60,000/month
   - **Buyer Studio USD** — $99/month
   - **Buyer Studio NGN** — ₦150,000/month
   - **Contributor Pro USD** — $9/month
   - **Contributor Pro NGN** — ₦14,000/month
4. Copy each plan's **Plan Code** (starts with `PLN_`)
5. Settings → Webhooks → Add endpoint:
   - URL: `https://your-vercel-url.vercel.app/api/webhooks/paystack`
   - Events: `subscription.create`, `charge.success`, `subscription.disable`, `transfer.success`, `transfer.failed`
6. Copy the **Webhook Secret**

---

## 6. Resend Setup

1. Go to [resend.com](https://resend.com) → API Keys → Create key
2. Add your domain (Domains → Add Domain) and verify it via DNS
3. Use `hello@yourdomain.com` as the FROM address

---

## 7. PostHog Setup

1. Go to [app.posthog.com](https://app.posthog.com) → New project
2. Copy **Project API Key** and **Host URL**

---

## 8. Fill in .env.local

Open `.env.local` and replace all placeholder values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres

BETTER_AUTH_SECRET=your-generated-secret
BETTER_AUTH_URL=http://localhost:3000

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_SECRET_KEY=sk_test_xxxx
PAYSTACK_PLAN_BUYER_PRO_USD=PLN_xxxx
PAYSTACK_PLAN_BUYER_PRO_NGN=PLN_xxxx
PAYSTACK_PLAN_BUYER_STUDIO_USD=PLN_xxxx
PAYSTACK_PLAN_BUYER_STUDIO_NGN=PLN_xxxx
PAYSTACK_PLAN_CONTRIBUTOR_PRO_USD=PLN_xxxx
PAYSTACK_PLAN_CONTRIBUTOR_PRO_NGN=PLN_xxxx
PAYSTACK_WEBHOOK_SECRET=xxxx

RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=hello@lekkerstock.com

NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 9. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 10. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Next.js (auto-detected)
```

Then in the Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add **all** the same variables from `.env.local`
3. Change `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to your Vercel production URL
4. Update Paystack webhook URL to use your Vercel URL
5. Redeploy

---

## 11. Make someone a Contributor

After a user signs up, run this in Supabase SQL Editor:

```sql
update profiles
set role = 'contributor'
where user_id = (select id from auth.users where email = 'user@example.com');
```

---

## 12. Make someone an Admin

```sql
update profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'admin@example.com');
```

---

## File Structure

```
lekkerstock/
├── src/
│   ├── app/
│   │   ├── (auth)/              # sign-in, sign-up (no navbar)
│   │   ├── (main)/              # marketplace, pricing, contributor (with navbar)
│   │   └── api/                 # all API routes
│   ├── components/
│   │   ├── layout/              # Navbar
│   │   ├── marketplace/         # MarketplaceClient, AssetCard, AssetModal
│   │   └── contributor/         # StudioClient, WithdrawModal
│   ├── lib/                     # supabase, auth, paystack, resend, posthog, utils
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # auth protection
├── supabase/
│   └── schema.sql               # run this in Supabase SQL Editor
├── .env.local                   # your secrets (never commit)
└── SETUP.md                     # this file
```

---

## What's Live

| Feature | Status |
|---|---|
| Auth (email/password + email verification) | ✅ |
| Sign up with role picker (Buyer / Contributor) | ✅ |
| Marketplace with search + filters + infinite scroll | ✅ |
| Asset detail modal with license selector | ✅ |
| One-time asset purchase via Paystack | ✅ |
| Subscription plans via Paystack | ✅ |
| Paystack webhook handler | ✅ |
| Contributor Studio dashboard | ✅ |
| File upload with drag & drop | ✅ |
| Withdrawal flow (Paystack Transfer) | ✅ |
| Earnings ledger + royalty calculation | ✅ |
| Email notifications (Resend) | ✅ |
| PostHog analytics | ✅ |
| Route protection (middleware) | ✅ |
| Row Level Security on all tables | ✅ |

## What's Next (Post-Launch)

- Google OAuth (credentials already wired in Better Auth)
- Admin panel for asset review/approval
- AI editing tools integration (your existing FastAPI backend)
- Collections / saved assets
- Contributor profile public pages
- Download management (buyer's license library)
