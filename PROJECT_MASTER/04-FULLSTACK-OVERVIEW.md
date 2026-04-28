# Future AI Pro — Full Stack Overview

## How Everything Connects

```
BROWSER (User)
     │
     │  HTTP Request
     ▼
EXPRESS SERVER (backend/server.js :3000)
     │
     ├── /api/auth/*     → authController.js    → db.json (users)
     ├── /api/ai/*       → aiController.js      → OpenAI API
     ├── /api/users/*    → userController.js    → db.json (users, messages)
     ├── /api/payments/* → paymentController.js → Stripe / PayPal
     └── /api/privacy/*  → privacyController.js → db.json (audit log)
     │
     │  Static files (HTML, CSS, JS, images)
     └── /* → serves index.html and all frontend files
```

---

## Complete File Map

```
future-ai-pro/
│
├── 📁 PROJECT_MASTER/          ← YOU ARE HERE — all guides
│   ├── README.md
│   ├── 01-FRONTEND.md
│   ├── 02-BACKEND.md
│   ├── 03-PUBLISH-GUIDE.md
│   └── 04-FULLSTACK-OVERVIEW.md
│
├── 📁 backend/                 ← Server-side code (Node.js)
│   ├── server.js               ← Main server
│   ├── config/
│   │   └── db.js               ← Database read/write
│   ├── controllers/
│   │   ├── aiController.js     ← AI logic
│   │   ├── authController.js   ← Login/register
│   │   ├── userController.js   ← User management
│   │   ├── paymentController.js← Payments
│   │   └── privacyController.js← Privacy
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── privacyRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js   ← JWT verification
│   │   ├── biasControl.js      ← AI bias detection
│   │   └── privacyControl.js   ← PII masking
│   └── context/
│       ├── contextStore.js     ← User context persistence
│       ├── emotionDetector.js  ← Emotion detection
│       ├── intentAnalyzer.js   ← Intent inference
│       ├── expertiseClassifier.js
│       └── styleAdapter.js
│
├── 📁 database/                ← Data storage
│   ├── db.json                 ← ALL data (auto-created)
│   ├── config/
│   │   └── db.js               ← Re-exports backend/config/db.js
│   └── models/
│       └── userModel.js        ← User CRUD
│
├── 📁 frontend/                ← Frontend assets folder
│   └── assets/
│       └── icons/
│           └── favicon.svg
│
├── 📁 public/                  ← Public uploads
│   └── uploads/
│
├── 📁 Future AI Pro images/    ← Product images
│
├── 📁 .kiro/specs/             ← Feature specifications
│   ├── human-context-understanding/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── ai-safety-control/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
├── 📄 HTML Pages (20 pages)
│   index.html, login.html, signup.html, dashboard.html,
│   chat.html, gpt.html, writer.html, analysis.html,
│   learning.html, image-gen.html, robot.html,
│   social-content.html, seo.html, counseling.html,
│   bias-control.html, privacy.html, search.html,
│   pricing.html, features.html, future-pro-ad.html
│
├── 📄 CSS Files (8 files)
│   style.css, gpt.css, robot.css, seo.css,
│   counseling.css, bias-control.css, privacy.css,
│   social-content.css
│
├── 📄 JavaScript Files (14 files)
│   app.js, bg.js, tech.js, social.js, ai-response.js,
│   gpt.js, robot.js, seo.js, counseling.js,
│   bias-control.js, privacy.js, search.js,
│   social-content.js, script.js
│
├── 📄 Config Files
│   .env                        ← API keys (never commit this!)
│   .gitignore                  ← Files to exclude from git
│   package.json                ← Dependencies
│   manifest.json               ← PWA config
│   sw.js                       ← Service worker
│   PUBLISH.md                  ← Quick publish reference
│
└── 📁 node_modules/            ← Installed packages (auto-generated)
```

---

## Request Lifecycle — Full Example

**User types "What is AI?" in the chat and clicks Send:**

```
1. BROWSER
   chat.html → sendChat() function runs
   → apiPost("/api/ai/chat", { message: "What is AI?", history: [] })
   → fetch() with Authorization: Bearer <token>

2. EXPRESS SERVER (backend/server.js)
   → aiLimiter checks rate limit (20 req/min)
   → requireAuth middleware verifies JWT token
   → routes to aiController.chat()

3. AI CONTROLLER (backend/controllers/aiController.js)
   → sanitize input (max 8000 chars)
   → checkCredits() — does user have credits?
   → detectBiasInPrompt() — check for bias
   → buildSystemPrompt() — assemble AI instructions
   → callOpenAI() — send to OpenAI API

4. OPENAI API (external)
   → GPT-4o-mini processes the message
   → Returns: "AI (Artificial Intelligence) is..."

5. BACK IN CONTROLLER
   → analyzeResponseForBias() — check response
   → deductCredit() — subtract 1 credit from user
   → res.json({ reply: "AI is...", credits: 9 })

6. BROWSER RECEIVES RESPONSE
   → appendMsg("ai", result.reply) — shows in chat
   → updates credits display
   → saves to history via apiPost("/api/users/history", ...)
```

---

## Data Flow Diagram

```
User Input
    │
    ▼
Frontend (HTML/JS)
    │ fetch() with JWT
    ▼
Express Middleware
    ├── Rate Limiter (20 req/min)
    ├── Auth Check (JWT verify)
    └── Bias Control (optional)
    │
    ▼
Controller
    ├── Validate input
    ├── Check credits
    ├── Build system prompt
    └── Call OpenAI
    │
    ▼
OpenAI API ──────────────────────────────────────────────────────────
    │                                                                │
    │ Response                                                       │
    ▼                                                                │
Controller                                                           │
    ├── Analyze response                                             │
    ├── Deduct credit                                                │
    └── Return to frontend                                           │
    │                                                                │
    ▼                                                                │
Database (db.json)                                                   │
    ├── Update user credits                                          │
    └── Save message to history                                      │
                                                                     │
Frontend displays response ◄─────────────────────────────────────────
```

---

## Security Layers

| Layer | What it protects |
|-------|-----------------|
| JWT tokens | Only logged-in users can use AI tools |
| bcrypt passwords | Passwords are hashed, never stored plain |
| Rate limiting | Prevents spam and abuse |
| Input sanitization | Strips dangerous characters |
| Bias control | Prevents biased AI outputs |
| Privacy control | PII masking, audit logging |
| `.gitignore` | API keys never uploaded to GitHub |
| Atomic DB writes | Prevents data corruption |

---

## Income Model Summary

```
Free User (10 credits)
    │
    │ Runs out of credits
    ▼
Upgrade Prompt
    │
    ├── Pro Plan ($19/mo) → 500 credits/month
    └── Elite Plan ($49/mo) → Unlimited credits

Revenue streams:
1. Monthly subscriptions (main income)
2. Credit top-ups (occasional users)
3. Google AdSense (free users see ads)
4. Affiliate links (tool recommendations)
5. API access (Elite plan)
```

---

## Quick Commands Reference

```bash
# Start development server
npm start

# Start with auto-reload on file changes
npm run dev

# Install a new package
npm install package-name

# Check if server starts without errors
node backend/server.js

# View database contents
cat database/db.json

# Clear database (fresh start)
del database\db.json    # Windows
rm database/db.json     # Mac/Linux
```

---

## Environment Quick Reference

| Variable | Required | Where to get |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ YES | platform.openai.com/api-keys |
| `JWT_SECRET` | ✅ YES | Any random string |
| `PORT` | ✅ YES | 3000 (default) |
| `STRIPE_SECRET_KEY` | ⚪ Optional | dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | ⚪ Optional | dashboard.stripe.com/webhooks |
| `PAYPAL_CLIENT_ID` | ⚪ Optional | developer.paypal.com |
| `PAYPAL_SECRET` | ⚪ Optional | developer.paypal.com |
