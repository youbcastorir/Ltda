# ⬡ BrandForge AI

> **AI-Powered Startup Branding Platform** — Generate company names, slogans, logos, color palettes, LinkedIn bios, SEO descriptions, and full landing pages in minutes.

---

## 🚀 Live Features

| Tool | Description |
|------|-------------|
| 🏷️ Company Name Generator | 6 AI-crafted names tailored to your industry & tone |
| 💬 Slogan Generator | 5 punchy taglines that stick |
| 🎨 AI Logo Creator | Instant SVG logo — downloadable, no API needed |
| 🎭 Color Palette Generator | Brand-aligned hex color system |
| 💼 LinkedIn Company Bio | Professional company description for your profile |
| 🔍 SEO Meta Description | Search-optimized copy under 155 characters |
| 🚀 Landing Page Builder | Full HTML page — download and deploy instantly |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic, accessible markup
- **CSS3** — Glassmorphism, dark/light mode, responsive grid
- **Vanilla JavaScript** — No frameworks, no build step
- **Groq API** (llama3-8b-8192) — Fast, low-cost AI generation
- **localStorage** — 6-hour result caching to minimize API calls

---

## ⚙️ API Setup

This project uses [Groq](https://console.groq.com/) for AI generation.

1. Go to [https://console.groq.com/](https://console.groq.com/) and create a free account
2. Generate an API key
3. Open `app.js` and replace the key on line 4:

```js
const GROQ_KEY = "your_groq_api_key_here";
```

> **Note:** The included key is for demo purposes. For production, use environment variables or a backend proxy.

---

## 📁 File Structure

```
brandforge-ai/
├── index.html       ← Main application
├── style.css        ← All styles (dark/light, responsive, glass UI)
├── app.js           ← All logic + API calls + caching
├── manifest.json    ← PWA manifest
├── sitemap.xml      ← SEO sitemap
├── robots.txt       ← Search engine directives
└── README.md        ← This file
```

---

## 🌐 Deployment

### GitHub Pages

```bash
# 1. Initialize git repo
git init

# 2. Stage all files
git add .

# 3. Commit
git commit -m "Launch BrandForge AI"

# 4. Rename branch to main
git branch -M main

# 5. Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/brandforge-ai.git

# 6. Push to GitHub
git push -u origin main
```

Then in your GitHub repo: **Settings → Pages → Source: main branch → / (root)** → Save.

Your site will be live at: `https://YOUR_USERNAME.github.io/brandforge-ai/`

---

### Netlify

1. Drag and drop the project folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Or connect your GitHub repo from the Netlify dashboard

---

### Vercel

```bash
npm i -g vercel
vercel
```

---

## 🔧 Local Development

No build step needed. Just open `index.html` in your browser or use a local server:

```bash
# Python
python -m http.server 3000

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

---

## 💡 Optimization Notes

- Logo and color palette generation uses **zero API calls** (pure JS algorithms)
- All AI results are cached in `localStorage` for 6 hours
- Prompts are kept under 60 tokens to minimize Groq usage
- `max_tokens` is capped at 100–400 per call based on tool

---

## 📄 License

MIT — Free to use, modify, and deploy.

---

## 📬 Contact

Built with ❤️ for founders.  
Email: [salatrir@gmail.com](mailto:salatrir@gmail.com)
