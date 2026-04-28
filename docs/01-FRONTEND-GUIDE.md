# Future AI Pro — Frontend Guide

## What is the Frontend?

The frontend is everything the user **sees and interacts with** in the browser. It is built with plain HTML, CSS, and JavaScript — no frameworks needed.

---

## Frontend File Structure

```
/ (project root)
├── index.html              ← Home page
├── login.html              ← Login page
├── signup.html             ← Register page
├── dashboard.html          ← User dashboard (after login)
├── chat.html               ← AI Chat tool
├── gpt.html                ← ChatGPT-like full chat experience
├── writer.html             ← AI Writer tool
├── analysis.html           ← AI Analysis tool
├── learning.html           ← AI Learning tool
├── image-gen.html          ← AI Image Generator
├── robot.html              ← Robot Control system
├── social-content.html     ← Social Media Content AI
├── seo.html                ← SEO Optimizer
├── counseling.html         ← AI Counseling system
├── bias-control.html       ← Bias Control settings
├── privacy.html            ← Privacy & Data settings
├── search.html             ← AI Search engine
├── pricing.html            ← Pricing page
├── features.html           ← Features page
├── future-pro-ad.html      ← Ad/About page
│
├── style.css               ← Main stylesheet (all pages)
├── gpt.css                 ← GPT chat page styles
├── robot.css               ← Robot page styles
├── seo.css                 ← SEO page styles
├── counseling.css          ← Counseling page styles
├── bias-control.css        ← Bias control styles
├── privacy.css             ← Privacy page styles
├── social-content.css      ← Social content styles
│
├── app.js                  ← Shared JS: API calls, auth, toasts, nav
├── bg.js                   ← Animated particle background
├── tech.js                 ← Voice input, PWA, keyboard shortcuts
├── social.js               ← Social share buttons
├── ai-response.js          ← Floating AI assistant panel
├── gpt.js                  ← GPT chat logic
├── robot.js                ← Robot control logic
├── seo.js                  ← SEO tool logic
├── counseling.js           ← Counseling system logic
├── bias-control.js         ← Bias settings logic
├── privacy.js              ← Privacy settings logic
├── search.js               ← Search engine logic
├── social-content.js       ← Social content generator logic
├── script.js               ← Legacy simple chat script
│
├── manifest.json           ← PWA manifest (installable app)
├── sw.js                   ← Service Worker (offline support)
│
└── Future AI Pro images/   ← All product images
    ├── Future Pro logo.jpeg
    ├── Future Pro welcome screen.jpeg
    ├── AI chat Assistant.png
    ├── AI Writer image.png
    ├── AI Analysis image.png
    ├── AI learning image.png
    ├── AI Image Generator (Feather page image.jpeg)
    ├── Future AI Pro setting image.png
    └── pricing page image.jpeg
```

---

## How Each Page Works

### Authentication Flow
```
User visits index.html
    ↓
Clicks "Login" → login.html
    ↓
Enters email + password → POST /api/auth/login
    ↓
Server returns JWT token
    ↓
Token saved to localStorage
    ↓
Redirected to dashboard.html
```

### How API Calls Work (app.js)

Every page uses these two functions from `app.js`:

```javascript
// POST request (with auth token automatically attached)
const result = await apiPost("/api/ai/chat", { message: "Hello" });

// GET request
const profile = await apiGet("/api/users/profile");
```

The token from `localStorage` is automatically added to every request header.

### How Login/Logout Works

```javascript
// Check if logged in (redirects to login.html if not)
requireLogin();

// Log out
logout();

// Show/hide nav items based on login state
checkNavAuth();
```

---

## Key Frontend Technologies

| Technology | Purpose |
|-----------|---------|
| HTML5 | Page structure |
| CSS3 (style.css) | Dark theme, responsive layout, animations |
| Vanilla JavaScript | All interactivity, no frameworks |
| Canvas API | Animated particle background (bg.js) |
| Web Speech API | Voice input (tech.js) |
| Service Worker | PWA / offline support (sw.js) |
| localStorage | Store JWT token and user data |
| Fetch API | All HTTP requests to backend |

---

## CSS Design System

All colors and sizes are CSS variables defined at the top of `style.css`:

```css
:root {
  --bg:      #0f172a;   /* Dark background */
  --bg2:     #1e293b;   /* Card background */
  --accent:  #38bdf8;   /* Cyan accent color */
  --text:    #e2e8f0;   /* Main text */
  --muted:   #94a3b8;   /* Secondary text */
  --radius:  12px;      /* Border radius */
}
```

### Light Mode
Add `data-theme="light"` to `<html>` to switch to light mode. Handled by `tech.js`.

---

## Adding a New Page

1. Create `yourpage.html` — copy the navbar from any existing page
2. Add `<link rel="stylesheet" href="style.css" />` in `<head>`
3. Add `<script src="app.js"></script>` before `</body>`
4. Add `requireLogin()` if the page needs authentication
5. Add a link to it in `dashboard.html`

---

## Running the Frontend Locally

The frontend is served by the backend server. Just run:

```bash
npm start
```

Then open: **http://localhost:3000**

No separate frontend server needed.

---

## Making the Site Installable (PWA)

The site can be installed as a mobile/desktop app because of:
- `manifest.json` — defines app name, icons, colors
- `sw.js` — caches files for offline use

Users will see an "Install" button in their browser automatically.
