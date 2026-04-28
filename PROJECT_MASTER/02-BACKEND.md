# Future AI Pro — Complete Backend Reference

## Backend Structure

```
backend/
├── server.js                    ← Main server entry point
├── config/
│   └── db.js                    ← Database (JSON file) read/write
├── controllers/
│   ├── aiController.js          ← All AI endpoints logic
│   ├── authController.js        ← Login / register logic
│   ├── userController.js        ← Profile, history, preferences
│   ├── paymentController.js     ← Stripe + PayPal payments
│   └── privacyController.js     ← Privacy settings, data export
├── routes/
│   ├── aiRoutes.js              ← /api/ai/* routes
│   ├── authRoutes.js            ← /api/auth/* routes
│   ├── userRoutes.js            ← /api/users/* routes
│   ├── paymentRoutes.js         ← /api/payments/* routes
│   └── privacyRoutes.js         ← /api/privacy/* routes
├── middleware/
│   ├── authMiddleware.js        ← JWT token verification
│   ├── biasControl.js           ← AI bias detection & control
│   └── privacyControl.js        ← PII masking, audit logging
└── context/
    ├── contextStore.js          ← User context persistence
    ├── emotionDetector.js       ← Emotion classification
    ├── intentAnalyzer.js        ← Intent inference
    ├── expertiseClassifier.js   ← Expertise level estimation
    └── styleAdapter.js          ← Communication style inference

database/
├── db.json                      ← All data (users, messages, etc.)
├── config/
│   └── db.js                    ← Re-exports backend/config/db.js
└── models/
    └── userModel.js             ← User CRUD operations
```

---

## All API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | What it does | Auth needed? |
|--------|---------|-------------|-------------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Login, returns JWT token | No |
| GET | `/api/auth/me` | Get current user from token | No |

**Register body:**
```json
{ "name": "John", "email": "john@example.com", "password": "mypassword" }
```

**Login body:**
```json
{ "email": "john@example.com", "password": "mypassword" }
```

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "name": "John", "email": "...", "plan": "free", "credits": 10 }
}
```

---

### AI Tools — `/api/ai`

All require `Authorization: Bearer <token>` header.

| Method | Endpoint | What it does |
|--------|---------|-------------|
| POST | `/api/ai/chat` | AI chat conversation |
| POST | `/api/ai/write` | Generate written content |
| POST | `/api/ai/analyze` | Analyze text |
| POST | `/api/ai/learn` | Learning content |
| POST | `/api/ai/image` | Generate image (DALL-E 3) |
| POST | `/api/ai/robot` | Robot AI brain commands |
| POST | `/api/ai/social` | Social content generation |

**Chat body:**
```json
{
  "message": "What is machine learning?",
  "history": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous reply" }
  ],
  "model": "gpt-4o-mini"
}
```

**Chat response:**
```json
{
  "reply": "Machine learning is...",
  "credits": 9,
  "bias": { "promptBias": [], "responseBias": [], "controlled": true }
}
```

**Write body:**
```json
{
  "type": "blog post",
  "topic": "Benefits of AI",
  "tone": "professional",
  "length": "medium"
}
```

**Analyze body:**
```json
{
  "text": "Your text here...",
  "analysisType": "general"
}
```
`analysisType` options: `general`, `sentiment`, `data`, `seo`

**Learn body:**
```json
{
  "topic": "Python programming",
  "level": "beginner",
  "format": "explanation"
}
```
`format` options: `explanation`, `quiz`, `roadmap`, `summary`

**Image body:**
```json
{ "prompt": "A futuristic city at sunset, digital art" }
```

---

### User Management — `/api/users`

All require auth token.

| Method | Endpoint | What it does |
|--------|---------|-------------|
| GET | `/api/users/profile` | Get user profile + credits |
| PUT | `/api/users/profile` | Update name |
| GET | `/api/users/history` | Get chat history |
| POST | `/api/users/history` | Save a message to history |
| DELETE | `/api/users/history` | Clear all history |
| GET | `/api/users/bias-prefs` | Get bias preferences |
| PUT | `/api/users/bias-prefs` | Save bias preferences |
| GET | `/api/users/safety-preferences` | Get safety settings |
| PUT | `/api/users/safety-preferences` | Save safety settings |

---

### Payments — `/api/payments`

| Method | Endpoint | What it does |
|--------|---------|-------------|
| GET | `/api/payments/config` | Check if Stripe/PayPal configured |
| POST | `/api/payments/checkout` | Create Stripe checkout session |
| POST | `/api/payments/paypal-order` | Create PayPal order |
| POST | `/api/payments/paypal-capture` | Capture PayPal payment |
| POST | `/api/payments/webhook` | Stripe webhook (auto-upgrade plan) |
| POST | `/api/payments/upgrade-test` | **Free test upgrade** (no payment needed) |

**Test upgrade body:**
```json
{ "plan": "pro" }
```
Plans: `pro` ($19/mo, 500 credits) or `elite` ($49/mo, unlimited)

---

### Privacy — `/api/privacy`

All require auth token.

| Method | Endpoint | What it does |
|--------|---------|-------------|
| GET | `/api/privacy/settings` | Get privacy settings |
| PUT | `/api/privacy/settings` | Save privacy settings |
| POST | `/api/privacy/consent` | Update consent |
| GET | `/api/privacy/export` | Download all your data (JSON) |
| DELETE | `/api/privacy/delete` | Delete account permanently |
| GET | `/api/privacy/audit-log` | View account activity log |
| DELETE | `/api/privacy/messages` | Clear all messages |
| POST | `/api/privacy/enforce-retention` | Apply data retention rules |

---

## Database (db.json)

The database is a single JSON file at `database/db.json`. Structure:

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "password": "bcrypt_hashed_password",
      "plan": "free",
      "credits": 10,
      "safetyPreferences": {
        "safetyLevel": "balanced",
        "safeModeEnabled": false,
        "categoryFilters": {
          "violence": true,
          "self_harm": true,
          "hate_speech": true,
          "illegal_content": true,
          "adult_content": true
        }
      },
      "biasPrefs": {},
      "privacy": {},
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "messages": [
    {
      "userId": "uuid",
      "role": "user",
      "content": "Hello AI",
      "feature": "chat",
      "timestamp": "2026-01-01T00:00:00.000Z"
    }
  ],
  "uploads": [],
  "context_profiles": {},
  "safetyAuditLog": [],
  "flaggedUsers": []
}
```

---

## Environment Variables (.env)

```env
# OpenAI — get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Stripe — get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal — get from https://developer.paypal.com
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...

# JWT Secret — any random string, keep it secret
JWT_SECRET=your_random_secret_here_change_this

# Server port
PORT=3000
```

---

## User Plans & Credits

| Plan | Price | Credits | Features |
|------|-------|---------|---------|
| Free | $0 | 10 total | All tools |
| Pro | $19/mo | 500/month | All tools + priority |
| Elite | $49/mo | Unlimited | All tools + API access |

Each AI request uses 1 credit. Free users run out after 10 requests.

---

## Rate Limiting

- **AI endpoints**: 20 requests per user per 60 seconds
- **Auth endpoints**: 10 requests per 15 minutes
- **IP blocking**: 50+ requests/60s from one IP → blocked 15 minutes

---

## How the Server Starts

```javascript
// backend/server.js
app.use("/api/auth",    authRoutes);     // login/register
app.use("/api/ai",      aiRoutes);       // all AI tools
app.use("/api/users",   userRoutes);     // profile, history
app.use("/api/payments",paymentRoutes);  // Stripe, PayPal
app.use("/api/privacy", privacyRoutes);  // privacy settings

// Serve all HTML/CSS/JS files
app.use(express.static(path.join(__dirname, "..")));

// Start listening
app.listen(3000);
```

---

## Adding a New API Endpoint

**Step 1** — Create controller function in `backend/controllers/`:
```javascript
// backend/controllers/myController.js
const MyController = {
  async doSomething(req, res) {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "Data required." });
    res.json({ result: "done", data });
  }
};
module.exports = MyController;
```

**Step 2** — Create route in `backend/routes/`:
```javascript
// backend/routes/myRoutes.js
const express = require("express");
const router = express.Router();
const MyController = require("../controllers/myController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/do-something", requireAuth, MyController.doSomething);
module.exports = router;
```

**Step 3** — Register in `backend/server.js`:
```javascript
const myRoutes = require("./routes/myRoutes");
app.use("/api/my-feature", myRoutes);
```

**Step 4** — Call from frontend:
```javascript
const result = await apiPost("/api/my-feature/do-something", { data: "hello" });
```
