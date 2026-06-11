# Mabrig Research Institute — Deployment Guide

## Stack

| Layer    | Service           | Cost    |
|----------|-------------------|---------|
| Frontend | Vercel            | Free    |
| Backend  | Railway           | Free ($5 credit/mo) |
| Database | MongoDB Atlas     | Free M0 |
| DNS/CDN  | Cloudflare        | Free    |
| Payments | Paystack          | Free (transaction fee only) |

---

## Step 1 — MongoDB Atlas (Database)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → create account
2. **New Project** → **Create Cluster** → choose **M0 Free Tier** → region closest to Nigeria (e.g. `AWS / eu-west-1`)
3. **Database Access** → Add Database User:
   - Username: `mabrigadmin`
   - Password: click **Autogenerate** — save it securely
   - Role: `Atlas Admin`
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** `0.0.0.0/0`
5. **Clusters** → **Connect** → **Connect your application** → copy the URI:
   ```
   mongodb+srv://mabrigadmin:<password>@cluster0.xxxxx.mongodb.net/mabrig_research
   ```
   Replace `<password>` with your actual password. This is your `MONGO_URI`.

---

## Step 2 — Deploy Backend on Railway

1. Go to [https://railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo** → select `mabrig1/MabrigResearch`
3. Railway detects Node.js automatically. Set the **Root Directory** to `mabrig-backend`
4. Go to your service → **Variables** tab → add all of these:

   | Variable         | Value                                        |
   |------------------|----------------------------------------------|
   | `NODE_ENV`       | `production`                                 |
   | `MONGO_URI`      | your Atlas connection string                 |
   | `JWT_SECRET`     | run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
   | `JWT_EXPIRES_IN` | `7d`                                         |
   | `PAYSTACK_SECRET`| `sk_live_xxxxx` from Paystack dashboard      |
   | `CLIENT_URL`     | `https://mabrigresearch.online`              |

5. **Settings** → **Networking** → **Generate Domain** (you get a free `xxx.up.railway.app` URL)
6. Test your API:
   ```
   GET https://xxx.up.railway.app/health
   → { "status": "ok" }
   ```
7. Later, add your custom domain `api.mabrigresearch.online` here (after Cloudflare is set up)

---

## Step 3 — Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) → **Login with GitHub**
2. **Add New** → **Project** → import `mabrig1/MabrigResearch`
3. Configuration:
   | Field | Value |
   |-------|-------|
   | Framework Preset | `Other` |
   | Root Directory | `/` (repo root) |
   | Build Command | *(leave blank)* |
   | Output Directory | `.` |
4. Click **Deploy** — Vercel auto-picks up `vercel.json`
5. Your site is live at `https://mabrig-frontend.vercel.app`
6. Later, add custom domain `mabrigresearch.online` under **Settings** → **Domains**

---

## Step 4 — Cloudflare (DNS + CDN + SSL)

Cloudflare manages your domain DNS and adds a free CDN layer in front of both Vercel and Railway.

### 4a — Add your domain to Cloudflare

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site** → enter `mabrigresearch.online`
2. Choose the **Free** plan
3. Cloudflare will scan your existing DNS records
4. Log in to your domain registrar (Namecheap / GoDaddy / etc.) → change nameservers to the two Cloudflare provides:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
5. Wait for propagation (5–30 minutes)

### 4b — DNS Records

In Cloudflare DNS dashboard, add these records:

**Frontend (Vercel):**
```
Type    Name    Content                         Proxy
CNAME   @       cname.vercel-dns.com            ON (orange cloud)
CNAME   www     cname.vercel-dns.com            ON (orange cloud)
```

**Backend (Railway):**
```
Type    Name    Content                         Proxy
CNAME   api     xxx.up.railway.app              ON (orange cloud)
```
Replace `xxx.up.railway.app` with your actual Railway domain.

### 4c — Vercel — connect the domain

1. Vercel → your project → **Settings** → **Domains**
2. Add `mabrigresearch.online` and `www.mabrigresearch.online`
3. Vercel verifies via Cloudflare DNS — SSL is automatic

### 4d — Railway — connect the API subdomain

1. Railway → your service → **Settings** → **Networking** → **Custom Domain**
2. Add `api.mabrigresearch.online`
3. Railway gives you a verification TXT record — add it in Cloudflare DNS

### 4e — Cloudflare SSL Settings

1. Cloudflare → your domain → **SSL/TLS** → set mode to **Full (strict)**
2. **Edge Certificates** → turn on **Always Use HTTPS**
3. **Speed** → **Optimization** → turn on **Auto Minify** (CSS, JS, HTML)

---

## Step 5 — Paystack Webhook

1. Go to [https://dashboard.paystack.com](https://dashboard.paystack.com) → **Settings** → **API Keys & Webhooks**
2. Under **Webhooks**, add:
   ```
   https://api.mabrigresearch.online/api/payments/webhook
   ```
3. Copy your **Secret Key** (`sk_live_xxxxx`) → set it as `PAYSTACK_SECRET` in Railway

**Test cards (development only):**
| Field | Value |
|-------|-------|
| Card | `4084 0840 8408 4081` |
| Expiry | Any future date |
| CVV | `408` |
| PIN | `0000` |
| OTP | `123456` |

---

## Step 6 — CI/CD (Auto-deploy on git push)

Every push to `main` automatically deploys both frontend and backend.

### Add secrets to GitHub

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → add:

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Settings → General → copy Team ID |
| `VERCEL_PROJECT_ID` | vercel.com → Project → Settings → General → copy Project ID |
| `RAILWAY_TOKEN` | railway.app → Account Settings → Tokens → New Token |

Once added, every `git push origin main` triggers `.github/workflows/deploy.yml` which:
1. Validates backend syntax
2. Deploys frontend to Vercel
3. Deploys backend to Railway

---

## Post-Deployment Checklist

- [ ] `GET https://api.mabrigresearch.online/health` → `{ "status": "ok" }`
- [ ] `https://mabrigresearch.online` loads with SSL padlock
- [ ] MongoDB Atlas → Clusters → shows active connections
- [ ] `POST /api/auth/register` creates a user
- [ ] `POST /api/papers/upload` accepts a PDF
- [ ] `PUT /api/papers/approve/:id` assigns a DOI
- [ ] `POST /api/payments/initialize` returns a Paystack checkout URL
- [ ] Paystack webhook URL is saved in Paystack dashboard
- [ ] Cloudflare → SSL → shows "Active Certificate"

---

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `5000` | No (Railway sets this) |
| `MONGO_URI` | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | 64-char hex string | Yes |
| `JWT_EXPIRES_IN` | `7d` | No |
| `PAYSTACK_SECRET` | `sk_live_xxxxx` | Yes |
| `CLIENT_URL` | `https://mabrigresearch.online` | Yes |

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
