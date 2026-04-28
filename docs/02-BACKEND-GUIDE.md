# Future AI Pro — Backend Guide

## What is the Backend?

The backend is the **server** that handles all logic, data storage, and AI API calls. It is built with **Node.js** and **Express.js**.

---

## Backend File Structure

```
backend/
├── server.js                    ← Main entry point — starts the server
│
├── config/
│   └── db.js                    ← JSON file database (read/write db.json)
│
├── controllers/
│   ├── aiController.js          ← Handles all AI requests (chat, write, analyze...)
│   ├── authController.js        ← Register and login
│   ├── userController.js        ← Profile, history, bias prefs
│   ├── paymentController.js     ← Stripe + PayPal payments
│   └── privacyController.js     ← Data export, deletion, audit log
│
├── middleware/
│   ├── authMiddleware.js        ← Verifies JWT token on protected routes
│   ├── biasControl.js           ← AI bias detection and control
│   └── privacyControl.js        ← PII masking, audit logging
│
├── routes/
│   ├── authRoutes.js            ← POST /api/auth/register, /login, /me
│   ├── aiRoutes.js              ← POST /api/ai/chat, /write, /analyze...
│   ├── userRoutes.js            ← GET/PUT /api/users/profile, /history...
│   ├── paymentRoutes.js         ← POST /api/payments/checkout, /webhook...
│   └── privacyRoutes.js         ← GET/PUT/DELETE /api/privacy/*
│
└── context/                     ← Human Context Understanding module
    ├── contextStore.js          ← Persists user context profiles
    ├── emotionDetector.js       ← Detects emotional tone
    ├── intentAnalyzer.js        ← Infers user intent
    ├── expertiseClassifier.js   ← Estimates expertise level
    └── styleAdapter.js          ← Infers communication style

database/
├── db.json                      ← The actual data file (auto-created)
└── models/
    └── userModel.js             ← User CRUD operations

.env                             ← Secret keys (never commit this)
```

---

## How the Server Works

### Starting the Server

```bash
npm start
# Runs: node backend/server.js
# Opens: http://localhost:3000
```

### Request Flow

```
Browser sends request
        ↓
Express receives it (backend/server.js)
        ↓
Rate limiter checks (max 20 AI requests/min)
        ↓
Route matched (/api/auth/login → authRoutes.js)
        ↓
Auth middleware checks JWT token (if protected route)
        ↓
Controller handles logic (authController.js)
        ↓
Database read/write (db.js → db.json)
        ↓
Response sent back to browser
```

---

## All API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user from token |

### AI Tools (all require login)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI chat with history |
| POST | `/api/ai/write` | Generate written content |
| POST | `/api/ai/analyze` | Analyze text/data |
| POST | `/api/ai/learn` | Learning content |
| POST | `/api/ai/image` | Generate image with DALL-E 3 |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update name |
| GET | `/api/users/history` | Get chat history |
| POST | `/api/users/history` | Save a message |
| DELETE | `/api/users/history` | Clear history |
| GET | `/api/users/bias-prefs` | Get bias settings |
| PUT | `/api/users/bias-prefs` | Save bias settings |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/config` | Check Stripe/PayPal configured |
| POST | `/api/payments/checkout` | Create Stripe checkout |
| POST | `/api/payments/paypal-order` | Create PayPal order |
| POST | `/api/payments/upgrade-test` | Free test upgrade |
| POST | `/api/payments/webhook` | Stripe webhook |

### Privacy
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/privacy/settings` | Get privacy settings |
| PUT | `/api/privacy/settings` | Save privacy settings |
| GET | `/api/privacy/export` | Download all user data |
| DELETE | `/api/privacy/delete` | Delete account |
| GET | `/api/privacy/audit-log` | View activity log |

---

## Database (db.json)

No external database needed. Everything is stored in `database/db.json`:

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John",
      "email": "john@example.com",
      "password": "bcrypt-hashed",
      "plan": "free",
      "credits": 10,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "messages": [
    {
      "userId": "uuid",
      "role": "user",
      "content": "Hello",
      "feature": "chat",
      "timestamp": "2026-01-01T00:00:00Z"
    }
  ],
  "context_profiles": {},
  "uploads": []
}
```

### How Writes Work (Atomic)
To prevent data corruption, every write uses a temp file:
```
1. Write new data to db.json.tmp
2. Rename db.json.tmp → db.json
3. If rename fails, original db.json is untouched
```

---

## Authentication (JWT)

1. User logs in → server creates a JWT token signed with `JWT_SECRET`
2. Token expires in 7 days
3. Every protected request must include: `Authorization: Bearer <token>`
4. `authMiddleware.js` verifies the token on every protected route

---

## Credit System

- **Free plan**: 10 credits total
- **Pro plan**: 500 credits/month
- **Elite plan**: Unlimited (stored as 99999)

Each AI request deducts 1 credit. Credits are deducted **after** a successful AI response (never on failure).

---

## Environment Variables (.env)

```env
OPENAI_API_KEY=sk-...          # From platform.openai.com
STRIPE_SECRET_KEY=sk_...       # From dashboard.stripe.com
STRIPE_WEBHOOK_SECRET=whsec_.. # From Stripe webhook settings
PAYPAL_CLIENT_ID=...           # From developer.paypal.com
PAYPAL_SECRET=...              # From developer.paypal.com
JWT_SECRET=any-random-string   # Keep this secret!
PORT=3000
```

---

## Adding a New API Endpoint

1. Create handler in `backend/controllers/yourController.js`
2. Create route in `backend/routes/yourRoutes.js`
3. Register in `backend/server.js`:
   ```javascript
   const yourRoutes = require("./routes/yourRoutes");
   app.use("/api/your", yourRoutes);
   ```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs (10 rounds) |
| JWT authentication | jsonwebtoken (7 day expiry) |
| Rate limiting | express-rate-limit (20 req/min for AI) |
| Input sanitization | Max length limits, HTML stripping |
| Atomic DB writes | Temp file + rename pattern |
| No raw message storage | Only metadata in audit logs |
