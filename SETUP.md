# Revvel Email Organizer — Setup Guide

This guide walks you through setting up the Revvel Email Organizer with proper API credentials for local development and production deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [API Credentials](#api-credentials)
4. [Production Deployment](#production-deployment)
5. [GitHub Actions Secrets](#github-actions-secrets)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 22+ ([Download](https://nodejs.org/))
- **pnpm** 10+ (install with `npm install -g pnpm`)
- **MySQL** 8+ or access to a managed MySQL/TiDB instance
- **Git** for version control

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MIDNGHTSAPPHIRE/revvel-email-organizer.git
cd revvel-email-organizer
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

The repository includes template files for environment configuration. **Never commit real credentials to version control.**

```bash
# Copy the example file to create your local .env
cp .env.example .env
```

Edit `.env` with your actual credentials (see [API Credentials](#api-credentials) section below).

### 4. Set Up the Database

**Option A: Using Docker Compose (Recommended)**

```bash
docker compose up -d db
```

**Option B: Use Your Own MySQL Instance**

Update `DATABASE_URL` in `.env` with your MySQL connection string:

```
DATABASE_URL=mysql://username:password@host:3306/revvel
```

**Push Database Schema**

```bash
pnpm db:push
```

### 5. Start the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## API Credentials

### Required Credentials

#### 1. Database Connection

**Variable:** `DATABASE_URL`

**Format:** `mysql://username:password@host:3306/database_name`

**Where to Get:**
- For local development, use the Docker Compose MySQL instance (see above)
- For production, use a managed MySQL service (AWS RDS, PlanetScale, TiDB Cloud, etc.)

---

#### 2. JWT Secret

**Variable:** `JWT_SECRET`

**Purpose:** Signs session cookies for user authentication

**How to Generate:**

```bash
openssl rand -hex 64
```

Copy the output and set it in your `.env` file.

---

#### 3. OpenRouter API Key

**Variable:** `OPENROUTER_API_KEY`

**Purpose:** Powers AI features (email summarization, commitment extraction, smart categorization, reply drafting)

**Where to Get:**
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-`)

**Add to `.env`:**

```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Demo Mode:** If this key is not set, the app will run in demo mode with AI features disabled. Users will see placeholder messages instead of real AI responses.

---

### Optional Credentials

#### 4. Google OAuth (Gmail Integration)

**Variables:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Purpose:** Enables real Gmail integration via OAuth 2.0

**Where to Get:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - For local dev: `http://localhost:3000/api/gmail/callback`
   - For production: `https://yourdomain.com/api/gmail/callback`
7. Click **Create** and copy the Client ID and Client Secret
8. Enable the **Gmail API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click **Enable**

**Add to `.env`:**

```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-secret-here
```

**Demo Mode:** If these credentials are not set, the app will run in demo mode with mock Gmail data. Users will see sample emails instead of their real inbox.

---

#### 5. Stripe (Billing & Subscriptions)

**Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_TEAM`

**Purpose:** Enables subscription billing for Pro ($15/mo) and Team ($25/user/mo) plans

**Where to Get:**
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Navigate to **Developers** → **API keys**
4. Copy your **Secret key** (use test keys for development)
5. Copy your **Publishable key**
6. Create products and prices:
   - Go to **Products** → **Add product**
   - Create "Pro Plan" ($15/month) and "Team Plan" ($25/month)
   - Copy the Price IDs (starts with `price_`)
7. Set up webhook endpoint:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (starts with `whsec_`)

**Add to `.env`:**

```bash
STRIPE_SECRET_KEY=sk_test_your-test-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_PRO=price_test_pro_id
STRIPE_PRICE_TEAM=price_test_team_id
```

**Note:** Use test keys (`sk_test_`, `pk_test_`) for development and live keys (`sk_live_`, `pk_live_`) for production.

---

## Production Deployment

### Security Best Practices

**NEVER commit real credentials to your repository.** The following files are already in `.gitignore`:

- `.env`
- `.env.local`
- `.env.test`
- `.env.production`

For production deployment, use one of the following methods to securely inject environment variables:

---

### Method 1: GitHub Actions Secrets (Recommended)

If you're deploying via GitHub Actions, store credentials as repository secrets.

#### Setting Up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each credential as a separate secret:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DATABASE_URL` | Production MySQL connection string | `mysql://user:pass@host:3306/db?ssl=true` |
| `JWT_SECRET` | Strong random secret (64+ chars) | `<output of openssl rand -hex 64>` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key (LIVE) | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (LIVE) | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan | `price_live_...` |
| `STRIPE_PRICE_TEAM` | Stripe Price ID for Team plan | `price_live_...` |

#### Using Secrets in GitHub Actions

In your `.github/workflows/deploy.yml` file, reference secrets like this:

```yaml
- name: Deploy to Production
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
    GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
    GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
    STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
    STRIPE_PRICE_PRO: ${{ secrets.STRIPE_PRICE_PRO }}
    STRIPE_PRICE_TEAM: ${{ secrets.STRIPE_PRICE_TEAM }}
  run: |
    # Your deployment commands here
```

---

### Method 2: Platform Environment Variables

Most hosting platforms (Vercel, Netlify, Railway, Render, Fly.io, etc.) provide a way to set environment variables via their dashboard or CLI.

**Example: Vercel**

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add OPENROUTER_API_KEY
# ... add all other variables
```

**Example: Railway**

```bash
railway variables set DATABASE_URL="mysql://..."
railway variables set JWT_SECRET="..."
railway variables set OPENROUTER_API_KEY="sk-or-v1-..."
# ... add all other variables
```

Refer to your platform's documentation for specific instructions.

---

### Method 3: Docker Secrets

If deploying with Docker, use Docker secrets or environment files that are **not** committed to version control.

**Example: Docker Compose with `.env` file**

```yaml
# docker-compose.prod.yml
services:
  app:
    image: revvel-email-organizer:latest
    env_file:
      - .env.production  # This file should NOT be in version control
```

Store `.env.production` securely on your server and ensure it's not accessible publicly.

---

## GitHub Actions Secrets

For automated deployments via GitHub Actions, you'll need to configure repository secrets as described in [Method 1](#method-1-github-actions-secrets-recommended) above.

### Example CI/CD Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          STRIPE_PRICE_PRO: ${{ secrets.STRIPE_PRICE_PRO }}
          STRIPE_PRICE_TEAM: ${{ secrets.STRIPE_PRICE_TEAM }}
        run: |
          # Your deployment script here
          # e.g., deploy to Vercel, Railway, etc.
```

---

## Troubleshooting

### "OPENROUTER_API_KEY is not configured"

**Symptom:** AI features show demo mode messages

**Solution:**
1. Verify `OPENROUTER_API_KEY` is set in your `.env` file
2. Restart the development server (`pnpm dev`)
3. Check that the key starts with `sk-or-v1-`

---

### "Google OAuth credentials not configured"

**Symptom:** Gmail integration shows demo mode

**Solution:**
1. Verify both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
2. Ensure the Gmail API is enabled in Google Cloud Console
3. Check that the redirect URI matches your environment:
   - Dev: `http://localhost:3000/api/gmail/callback`
   - Prod: `https://yourdomain.com/api/gmail/callback`
4. Restart the development server

---

### Database Connection Errors

**Symptom:** `ECONNREFUSED` or `Access denied` errors

**Solution:**
1. If using Docker Compose, ensure the database is running:
   ```bash
   docker compose up -d db
   docker compose logs db
   ```
2. Verify `DATABASE_URL` format: `mysql://username:password@host:3306/database`
3. Check that the database user has proper permissions
4. For production, ensure SSL is enabled: `?ssl=true`

---

### Stripe Webhook Errors

**Symptom:** Subscription events not processing

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check that the webhook endpoint is publicly accessible
3. Test webhook locally using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Ensure the correct events are selected in Stripe Dashboard

---

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Need Help?

If you encounter issues not covered in this guide, please:

1. Check the [GitHub Issues](https://github.com/MIDNGHTSAPPHIRE/revvel-email-organizer/issues)
2. Review the [README.md](./README.md) for general setup information
3. Open a new issue with detailed information about your problem

---

**Security Reminder:** Always keep your API keys and secrets confidential. Never commit them to version control, share them publicly, or expose them in client-side code.
