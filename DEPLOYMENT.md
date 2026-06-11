# Mabrig Research Institute — Deployment Guide

## Architecture Overview

```
mabrigresearch.online          (Frontend — static HTML)
api.mabrigresearch.online      (Backend — Node.js API)
MongoDB Atlas                  (Database — cloud)
Paystack                       (Payments)
AfriGrantPipeline              (External grants partner)
```

---

## Option A: Render.com (Recommended — Free Tier Available)

Render hosts both the static frontend and the Node.js backend under one account.

### Step 1 — MongoDB Atlas (Database)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new project → **New Cluster** → choose **M0 Free Tier** → region: `AWS / eu-west-1` (Ireland) or nearest
3. Under **Database Access** → Add a user:
   - Username: `mabrigadmin`
   - Password: generate a strong password, save it
   - Role: `Atlas Admin`
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Under **Clusters** → Connect → **Connect your application** → copy the connection string:
   ```
   mongodb+srv://mabrigadmin:<password>@cluster0.xxxxx.mongodb.net/mabrig_research
   ```
   Replace `<password>` with your actual password. Save this as `MONGO_URI`.

---

### Step 2 — Deploy Backend on Render

1. Push this repo to GitHub (github.com)
2. Go to [https://render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Fill in:
   | Field | Value |
   |-------|-------|
   | Name | `mabrig-backend` |
   | Root Directory | `mabrig-backend` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | Free (or Starter for always-on) |

5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string (32+ chars) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `PAYSTACK_SECRET` | `sk_live_xxxxx` from Paystack dashboard |
   | `CLIENT_URL` | `https://mabrigresearch.online` |

6. Click **Create Web Service** — Render will build and deploy
7. Your API will be live at: `https://mabrig-backend.onrender.com`

---

### Step 3 — Deploy Frontend on Render (Static Site)

1. On Render → **New** → **Static Site**
2. Connect the same GitHub repo
3. Fill in:
   | Field | Value |
   |-------|-------|
   | Name | `mabrig-frontend` |
   | Root Directory | `/` (repo root) |
   | Build Command | *(leave blank)* |
   | Publish Directory | `.` |

4. Click **Create Static Site**
5. Your site will be live at: `https://mabrig-frontend.onrender.com`

---

### Step 4 — Connect Custom Domain (mabrigresearch.online)

**Frontend (Render Static Site):**
1. In Render → your static site → **Custom Domains** → Add `mabrigresearch.online` and `www.mabrigresearch.online`
2. Log in to your domain registrar (Namecheap, GoDaddy, etc.)
3. Add DNS records:
   ```
   Type    Host    Value
   CNAME   www     mabrig-frontend.onrender.com
   ALIAS   @       mabrig-frontend.onrender.com
   ```
4. Render automatically provisions an SSL certificate (Let's Encrypt)

**Backend (Render Web Service):**
1. In Render → backend service → **Custom Domains** → Add `api.mabrigresearch.online`
2. At your registrar, add:
   ```
   Type    Host    Value
   CNAME   api     mabrig-backend.onrender.com
   ```
3. Update `CLIENT_URL` env var on Render to `https://mabrigresearch.online`

---

## Option B: Netlify (Frontend) + Railway (Backend)

### Frontend on Netlify

1. Go to [https://netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect GitHub repo
3. Build settings:
   - Base directory: *(leave blank)*
   - Build command: *(leave blank)*
   - Publish directory: `.`
4. Deploy → your site is live at `https://yoursite.netlify.app`
5. **Custom domain**: Site settings → Domain management → Add `mabrigresearch.online`
6. Update your registrar DNS:
   ```
   Type     Host    Value
   CNAME    www     yoursite.netlify.app
   A        @       75.2.60.5
   ```

### Backend on Railway

1. Go to [https://railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo → set **Root Directory** to `mabrig-backend`
3. Railway auto-detects Node.js
4. Under **Variables**, add same env vars as the Render list above
5. Under **Settings** → **Domains** → Generate domain or add custom `api.mabrigresearch.online`

---

## Option C: VPS (DigitalOcean / AWS EC2)

Use this for full control. Requires a server (min $6/mo DigitalOcean Droplet).

### Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Clone the repo
git clone https://github.com/mabrig1/MabrigResearch.git /var/www/mabrig
cd /var/www/mabrig/mabrig-backend

# Install dependencies
npm install --production

# Create .env file
cp .env.example .env
nano .env   # fill in all values

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup    # auto-start on reboot
pm2 save
```

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/mabrig
```

Paste the Nginx config (see `nginx.conf` in this repo), then:

```bash
sudo ln -s /etc/nginx/sites-available/mabrig /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mabrigresearch.online -d www.mabrigresearch.online -d api.mabrigresearch.online
```

---

## Paystack Setup

1. Create account at [https://dashboard.paystack.com](https://dashboard.paystack.com)
2. Complete business verification (required for live keys)
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy **Secret Key** (`sk_live_xxxxx`) → set as `PAYSTACK_SECRET` in your env
5. Under **Webhooks**, add:
   ```
   https://api.mabrigresearch.online/api/payments/webhook
   ```
6. For testing, use `sk_test_xxxxx` with test cards:
   - Card: `4084 0840 8408 4081`  |  Expiry: any future date  |  CVV: `408`
   - PIN: `0000`  |  OTP: `123456`

---

## Post-Deployment Checklist

- [ ] `GET https://api.mabrigresearch.online/health` returns `{ status: "ok" }`
- [ ] `POST /api/auth/register` creates a user
- [ ] `POST /api/papers/upload` accepts a file
- [ ] `PUT /api/papers/approve/:id` assigns a DOI
- [ ] `POST /api/payments/initialize` returns a Paystack URL
- [ ] Frontend loads at `https://mabrigresearch.online`
- [ ] SSL certificate is active (padlock in browser)
- [ ] MongoDB Atlas shows connections from your server IP
- [ ] Paystack webhook URL is set in dashboard

---

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `5000` | No (default 5000) |
| `MONGO_URI` | `mongodb+srv://...` | Yes |
| `JWT_SECRET` | `your_64_char_random_string` | Yes |
| `JWT_EXPIRES_IN` | `7d` | No (default 7d) |
| `PAYSTACK_SECRET` | `sk_live_xxxxx` | Yes |
| `CLIENT_URL` | `https://mabrigresearch.online` | Yes |

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
