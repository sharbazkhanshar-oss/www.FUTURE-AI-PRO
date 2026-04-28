# Future AI Pro — Step-by-Step Publish Guide

## Before You Start — Checklist

- [ ] Node.js 18+ installed on your computer
- [ ] OpenAI API key (required for AI to work)
- [ ] Stripe account (optional — for real payments)
- [ ] PayPal developer account (optional)
- [ ] GitHub account (for deployment)

---

## STEP 1 — Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This installs all required packages from `package.json`.

---

## STEP 2 — Set Up Your API Keys

Open the `.env` file and fill in your keys:

```env
# REQUIRED — AI won't work without this
OPENAI_API_KEY=sk-proj-your-key-here

# OPTIONAL — for real card payments
STRIPE_SECRET_KEY=sk_live_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here

# OPTIONAL — for PayPal payments
PAYPAL_CLIENT_ID=your-client-id-here
PAYPAL_SECRET=your-secret-here

# REQUIRED — change this to any random string
JWT_SECRET=future_ai_pro_change_this_to_something_random_2026

# Port (leave as 3000)
PORT=3000
```

### Where to get each key:

| Key | Website | How to get it |
|-----|---------|--------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Sign up → API Keys → Create new key |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys | Sign up → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/webhooks | Add endpoint → copy signing secret |
| `PAYPAL_CLIENT_ID` | https://developer.paypal.com/dashboard | My Apps → Create App → copy Client ID |
| `PAYPAL_SECRET` | https://developer.paypal.com/dashboard | Same app → copy Secret |

> **Note:** You can test the site WITHOUT Stripe/PayPal using the "🧪 Test Upgrade" button on the pricing page.

---

## STEP 3 — Test Locally

```bash
npm start
```

Open your browser: **http://localhost:3000**

You should see the Future AI Pro home page.

**Test checklist:**
- [ ] Home page loads
- [ ] Sign up creates an account
- [ ] Login works
- [ ] Dashboard shows all tools
- [ ] AI Chat responds (needs OpenAI key)
- [ ] Pricing page shows plans

---

## STEP 4 — Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial Future AI Pro deployment"

# Create repo on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/future-ai-pro.git
git push -u origin main
```

> **Important:** Make sure `.gitignore` contains `.env` and `node_modules/` so your secrets are never uploaded.

---

## STEP 5 — Deploy to Render (FREE — Recommended)

**Render** gives you a free live URL in minutes.

### 5.1 — Sign up
Go to **https://render.com** and sign up with GitHub.

### 5.2 — Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Fill in settings:

| Setting | Value |
|---------|-------|
| Name | `future-ai-pro` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | `Free` |

### 5.3 — Add Environment Variables
In Render dashboard → **Environment** tab → Add each variable:

```
OPENAI_API_KEY     = sk-proj-...
JWT_SECRET         = your_random_secret
STRIPE_SECRET_KEY  = sk_live_... (optional)
PORT               = 3000
```

### 5.4 — Deploy
Click **Create Web Service**. Render will:
1. Download your code from GitHub
2. Run `npm install`
3. Run `npm start`
4. Give you a URL like: `https://future-ai-pro.onrender.com`

**Your site is now live!** 🎉

---

## STEP 6 — Deploy to Railway (Alternative)

**Railway** is another free option with more generous limits.

1. Go to **https://railway.app**
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Go to **Variables** tab → add all `.env` variables
5. Railway auto-deploys and gives you a URL

---

## STEP 7 — Add a Custom Domain (Optional)

If you have a domain like `www.future-ai-pro.com`:

### On Render:
1. Dashboard → your service → **Settings** → **Custom Domains**
2. Add your domain
3. Copy the CNAME record shown
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Add the CNAME record in DNS settings
6. Wait 10-30 minutes for DNS to update

### Domain registrars:
- **Namecheap**: https://namecheap.com (~$10/year)
- **GoDaddy**: https://godaddy.com (~$12/year)
- **Google Domains**: https://domains.google.com (~$12/year)

---

## STEP 8 — Set Up Stripe for Real Payments

### 8.1 — Create Products in Stripe
1. Go to https://dashboard.stripe.com/products
2. Create **Pro Plan**: $19/month recurring
3. Copy the **Price ID** (looks like `price_1ABC...`)
4. Create **Elite Plan**: $49/month recurring
5. Copy that Price ID too

### 8.2 — Update Price IDs
Open `backend/controllers/paymentController.js` and update:

```javascript
const PLANS = {
  pro:   { stripeId: "price_YOUR_PRO_PRICE_ID",   ... },
  elite: { stripeId: "price_YOUR_ELITE_PRICE_ID", ... }
};
```

### 8.3 — Set Up Webhook
1. Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-site.onrender.com/api/payments/webhook`
4. Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`
5. Copy the **Signing secret** → add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## STEP 9 — Set Up PayPal (Optional)

1. Go to https://developer.paypal.com/dashboard
2. Click **My Apps & Credentials**
3. Click **Create App**
4. Name it "Future AI Pro"
5. Copy **Client ID** and **Secret**
6. Add to `.env`

> For production, change sandbox URLs to live URLs in `paymentController.js`:
> - `https://api-m.sandbox.paypal.com` → `https://api-m.paypal.com`

---

## STEP 10 — Test Everything Live

After deployment, test:

- [ ] Home page loads at your URL
- [ ] Sign up works
- [ ] Login works
- [ ] AI Chat responds
- [ ] Image generation works
- [ ] Pricing page shows payment options
- [ ] Test upgrade button works
- [ ] Dashboard shows credits

---

## Updating Your Site

After making changes:

```bash
git add .
git commit -m "Update: description of changes"
git push
```

Render/Railway will automatically redeploy within 2-3 minutes.

---

## Troubleshooting

### Site won't start
```bash
# Check for errors
npm start

# Common fixes:
# 1. Make sure .env has JWT_SECRET set
# 2. Make sure node_modules exists (run npm install)
# 3. Check Node.js version (needs 18+): node --version
```

### AI not responding
- Check `OPENAI_API_KEY` is correct in `.env`
- Check you have credits on your OpenAI account
- Check the browser console for error messages

### Login not working
- Check `JWT_SECRET` is set in `.env`
- Try clearing browser localStorage: `localStorage.clear()`

### Database errors
- Delete `database/db.json` and restart — it will recreate automatically

### Payments not working
- Use "🧪 Test Upgrade" button on pricing page (works without Stripe)
- Check Stripe keys are correct
- Make sure webhook URL is correct

---

## Cost Summary

| Service | Cost | What for |
|---------|------|---------|
| Render (hosting) | Free | Run the server |
| OpenAI API | ~$0.01 per 1K tokens | AI responses |
| DALL-E 3 | ~$0.04 per image | Image generation |
| Stripe | 2.9% + $0.30 per transaction | Card payments |
| Domain name | ~$10/year | Custom URL |

**Estimated monthly cost for 100 users:** ~$5-20 (mostly OpenAI API)

---

## Income Potential

| Users | Monthly Revenue |
|-------|----------------|
| 50 Pro users | $950/month |
| 200 Pro users | $3,800/month |
| 500 Pro + 50 Elite | $12,000/month |
| 2,000 Pro + 300 Elite | $52,700/month |

The free plan is your funnel — users try it, run out of 10 credits, then upgrade to Pro.
