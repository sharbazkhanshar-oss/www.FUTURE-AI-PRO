# Future AI Pro — Complete Frontend Reference

## All Frontend Files

### HTML Pages

| File | Purpose | Needs Login? |
|------|---------|-------------|
| `index.html` | Home / landing page | No |
| `login.html` | User login | No |
| `signup.html` | User registration | No |
| `dashboard.html` | User dashboard with all tools | Yes |
| `chat.html` | Simple AI Chat | Yes |
| `gpt.html` | Full ChatGPT-like experience | Yes |
| `writer.html` | AI content writer | Yes |
| `analysis.html` | AI text analysis | Yes |
| `learning.html` | AI learning tool | Yes |
| `image-gen.html` | AI image generator | Yes |
| `robot.html` | Robot control system | Yes |
| `social-content.html` | Social media content AI | Yes |
| `seo.html` | SEO optimizer | Yes |
| `counseling.html` | AI counseling system | Yes |
| `bias-control.html` | Bias control settings | Yes |
| `privacy.html` | Privacy & data settings | Yes |
| `search.html` | AI-powered search | No |
| `pricing.html` | Pricing plans | No |
| `features.html` | Features overview | No |
| `future-pro-ad.html` | About / Ad page | No |

---

### CSS Files

| File | Styles for |
|------|-----------|
| `style.css` | ALL pages — main stylesheet |
| `gpt.css` | GPT chat page only |
| `robot.css` | Robot control page only |
| `seo.css` | SEO tool page only |
| `counseling.css` | Counseling page only |
| `bias-control.css` | Bias control page only |
| `privacy.css` | Privacy page only |
| `social-content.css` | Social content page only |

---

### JavaScript Files

| File | Purpose |
|------|---------|
| `app.js` | **Core** — API calls, auth, toasts, nav, page transitions |
| `bg.js` | Animated particle/neural network background |
| `tech.js` | Voice input, PWA install, keyboard shortcuts, theme toggle |
| `social.js` | Social share buttons (Facebook, Twitter, WhatsApp, etc.) |
| `ai-response.js` | Floating AI assistant panel (bottom-left) |
| `gpt.js` | Full GPT chat — sessions, markdown, code highlighting |
| `robot.js` | Robot arena, D-pad controls, sensors, AI brain |
| `seo.js` | SEO analysis, keyword research, meta tag generator |
| `counseling.js` | 8 counselor types, exercises, mood tracker, journal |
| `bias-control.js` | Bias settings, live tester, bias detection log |
| `privacy.js` | Privacy settings, data export, audit log |
| `search.js` | AI search with web results and AI summaries |
| `social-content.js` | Social post generator, hashtags, content calendar |
| `script.js` | Legacy simple chat (old version) |

---

### PWA Files

| File | Purpose |
|------|---------|
| `manifest.json` | Makes site installable as an app |
| `sw.js` | Service worker — caches files for offline use |

---

## CSS Design System (style.css)

All colors are CSS variables — change them once, updates everywhere:

```css
:root {
  --bg:      #0f172a;   /* Main dark background */
  --bg2:     #1e293b;   /* Card/panel background */
  --bg3:     #0d1117;   /* Darkest background */
  --accent:  #38bdf8;   /* Cyan — main brand color */
  --accent2: #0ea5e9;   /* Darker cyan for hover */
  --text:    #e2e8f0;   /* Main text color */
  --muted:   #94a3b8;   /* Secondary/grey text */
  --green:   #22c55e;   /* Success color */
  --purple:  #a855f7;   /* Purple accent */
  --radius:  12px;      /* Border radius for cards */
  --shadow:  0 4px 24px rgba(0,0,0,.4);  /* Card shadow */
}
```

### Light Mode
Toggle with `data-theme="light"` on `<html>`. Handled automatically by `tech.js`.

---

## How Authentication Works (Frontend)

```javascript
// 1. After login — save token
localStorage.setItem("token", result.token);
localStorage.setItem("user", JSON.stringify(result.user));

// 2. On protected pages — redirect if not logged in
requireLogin();  // in app.js

// 3. Every API call — token auto-attached
const result = await apiPost("/api/ai/chat", { message: "Hello" });
const profile = await apiGet("/api/users/profile");

// 4. Logout
logout();  // clears localStorage, redirects to index.html
```

---

## How to Add a New Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page — Future AI Pro</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="bgCanvas"></canvas>

  <!-- Copy navbar from any existing page -->
  <nav class="navbar">...</nav>

  <!-- Your page content -->
  <section class="tool-page">
    <div class="tool-header">
      <h1>My Tool</h1>
    </div>
  </section>

  <!-- Required scripts -->
  <script src="app.js"></script>
  <script src="bg.js"></script>
  <script src="ai-response.js"></script>
  <script>
    requireLogin(); // Remove this line if page is public
  </script>
</body>
</html>
```

---

## Images Folder

All images are in `Future AI Pro images/`:

| Image File | Used on |
|-----------|---------|
| `Future Pro logo.jpeg` | Navbar logo, auth pages |
| `Future Pro welcome screen.jpeg` | Hero section background |
| `AI chat Assistant.png` | Chat feature card |
| `AI Writer image.png` | Writer feature card |
| `AI Analysis image.png` | Analysis feature card |
| `AI learning image.png` | Learning feature card |
| `Feather page image.jpeg` | Image gen feature card |
| `Future AI Pro setting image.png` | Settings preview |
| `pricing page image.jpeg` | Pricing page hero |
| `Futureprohome screen.jpeg` | Ad page |

---

## Key Frontend Patterns

### Show a Toast Notification
```javascript
showToast("Message saved!", "success");  // green
showToast("Something went wrong", "error");  // red
showToast("Loading...", "info");  // blue
```

### Make an API Call
```javascript
// POST
const result = await apiPost("/api/ai/chat", {
  message: "Hello AI",
  history: []
});
if (result.error) { showToast(result.error, "error"); return; }
console.log(result.reply);

// GET
const profile = await apiGet("/api/users/profile");
```

### Get Current User
```javascript
const user = getUser();  // returns parsed user object from localStorage
const token = getToken(); // returns JWT token string
```
