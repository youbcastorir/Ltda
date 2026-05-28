/* ===========================
   BrandForge AI — app.js
   =========================== */

const GROQ_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-8b-8192";
const CACHE_PREFIX = "bf_cache_";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/* ---- DOM Refs ---- */
const $ = id => document.getElementById(id);
const industryEl = () => $("industryInput").value.trim();
const audienceEl  = () => $("audienceInput").value.trim();
const descEl      = () => $("descInput").value.trim();
const toneEl      = () => $("toneInput").value;
const keywordsEl  = () => $("keywordsInput").value.trim();

/* ---- Theme ---- */
const html = document.documentElement;
const saved = localStorage.getItem("bf_theme") || "dark";
html.setAttribute("data-theme", saved);
$("themeToggle").querySelector(".theme-icon").textContent = saved === "dark" ? "☀" : "☾";

$("themeToggle").addEventListener("click", () => {
  const t = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", t);
  localStorage.setItem("bf_theme", t);
  $("themeToggle").querySelector(".theme-icon").textContent = t === "dark" ? "☀" : "☾";
});

/* ---- Header scroll ---- */
window.addEventListener("scroll", () => {
  $("header") && $("header").classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

/* ---- Mobile nav ---- */
$("navBurger").addEventListener("click", () => {
  $("navMobile").classList.toggle("open");
});
document.querySelectorAll(".nav-mobile a").forEach(a => {
  a.addEventListener("click", () => $("navMobile").classList.remove("open"));
});

/* ---- Char count ---- */
$("descInput").addEventListener("input", () => {
  $("charCount").textContent = `${$("descInput").value.length}/200`;
});

/* ---- FAQ accordion ---- */
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  });
});

/* ---- Toast ---- */
function showToast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = "toast", 2500);
}

/* ---- Cache ---- */
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null; }
    return value;
  } catch { return null; }
}
function cacheSet(key, value) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, ts: Date.now() })); } catch {}
}
function buildCacheKey(tool) {
  return `${tool}_${industryEl()}_${descEl()}_${toneEl()}`.replace(/\s+/g, "_").slice(0, 120);
}

/* ---- Validate input ---- */
function getContext() {
  const industry = industryEl();
  const desc = descEl();
  if (!industry && !desc) {
    showToast("Please describe your startup first ✍️", "error");
    document.getElementById("tools").scrollIntoView({ behavior: "smooth" });
    return null;
  }
  return {
    industry: industry || "tech startup",
    audience: audienceEl() || "general users",
    desc: desc || "innovative product",
    tone: toneEl(),
    keywords: keywordsEl()
  };
}

/* ---- Groq API call ---- */
async function groq(prompt, maxTokens = 300) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.85,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/* ---- Loading state ---- */
function setLoading(id, isLoading) {
  const btn = document.querySelector(`[data-action="${id}"]`);
  if (btn) {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Generating…" : btn.getAttribute("data-original") || btn.textContent;
    if (!btn.getAttribute("data-original")) btn.setAttribute("data-original", btn.textContent);
  }
  const result = $(`result-${id}`);
  if (isLoading && result) {
    result.innerHTML = `<div class="result-loading"><div class="spinner"></div> Generating with AI…</div>`;
  }
}

/* ---- Copy to clipboard ---- */
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard ✓")).catch(() => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    showToast("Copied ✓");
  });
}

/* ===========================
   TOOL: Company Names
   =========================== */
async function generateNames() {
  const ctx = getContext();
  if (!ctx) return;
  const cKey = buildCacheKey("names");
  const cached = cacheGet(cKey);
  if (cached) return renderNames(cached);
  setLoading("names", true);
  try {
    const prompt = `Generate 6 creative startup company names for: Industry: ${ctx.industry}. Product: ${ctx.desc}. Tone: ${ctx.tone}. Return only a JSON array of 6 strings, no explanation.`;
    const raw = await groq(prompt, 150);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const names = JSON.parse(cleaned);
    cacheSet(cKey, names);
    renderNames(names);
  } catch (e) {
    $("result-names").innerHTML = `<div class="result-text">⚠ ${e.message}. Try again.</div>`;
  }
  setLoading("names", false);
}

function renderNames(names) {
  const el = $("result-names");
  el.innerHTML = `<div class="result-names">${names.map(n =>
    `<div class="result-item" onclick="copyText('${n.replace(/'/g,"\\'")}')">
      <span>${n}</span><span class="copy-hint">click to copy</span>
    </div>`
  ).join("")}</div>`;
}

/* ===========================
   TOOL: Slogans
   =========================== */
async function generateSlogans() {
  const ctx = getContext();
  if (!ctx) return;
  const cKey = buildCacheKey("slogans");
  const cached = cacheGet(cKey);
  if (cached) return renderSlogans(cached);
  setLoading("slogans", true);
  try {
    const prompt = `Write 5 memorable startup slogans for: ${ctx.desc}. Industry: ${ctx.industry}. Tone: ${ctx.tone}. Return only a JSON array of 5 strings.`;
    const raw = await groq(prompt, 180);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const slogans = JSON.parse(cleaned);
    cacheSet(cKey, slogans);
    renderSlogans(slogans);
  } catch (e) {
    $("result-slogans").innerHTML = `<div class="result-text">⚠ ${e.message}. Try again.</div>`;
  }
  setLoading("slogans", false);
}

function renderSlogans(slogans) {
  const el = $("result-slogans");
  el.innerHTML = `<div class="result-slogans">${slogans.map(s =>
    `<div class="result-item" onclick="copyText('${s.replace(/'/g,"\\'")}')">
      <span>${s}</span><span class="copy-hint">click to copy</span>
    </div>`
  ).join("")}</div>`;
}

/* ===========================
   TOOL: Logo Creator (SVG, no API)
   =========================== */
function generateLogo() {
  const ctx = getContext();
  if (!ctx) return;
  setLoading("logo", true);

  setTimeout(() => {
    const cKey = buildCacheKey("logo");
    const cached = cacheGet(cKey);
    if (cached) { renderLogo(cached); setLoading("logo", false); return; }

    const name = (industryEl() || "Brand").split(" ")[0].toUpperCase();
    const initials = name.slice(0, 2);
    const palettes = [
      ["#6ee7b7", "#0a0b0f"],
      ["#38bdf8", "#0a0b0f"],
      ["#a78bfa", "#0a0b0f"],
      ["#fbbf24", "#0a0b0f"],
      ["#f472b6", "#0a0b0f"],
    ];
    const shapes = ["hex", "circle", "square", "diamond"];
    const seed = name.charCodeAt(0) % palettes.length;
    const [accent, bg] = palettes[seed];
    const shape = shapes[seed % shapes.length];

    let bgShape = "";
    if (shape === "hex") {
      bgShape = `<polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="${accent}"/>`;
    } else if (shape === "circle") {
      bgShape = `<circle cx="50" cy="50" r="45" fill="${accent}"/>`;
    } else if (shape === "square") {
      bgShape = `<rect x="5" y="5" width="90" height="90" rx="20" fill="${accent}"/>`;
    } else {
      bgShape = `<polygon points="50,5 95,50 50,95 5,50" fill="${accent}"/>`;
    }

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${accent}cc;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <g transform="scale(0.85) translate(5,7)">
    ${bgShape}
    <text x="50" y="62" text-anchor="middle" font-size="32" font-weight="900"
      font-family="Arial Black, sans-serif" fill="${bg}" letter-spacing="-2">${initials}</text>
  </g>
  <text x="108" y="55" font-size="22" font-weight="900"
    font-family="Arial Black, sans-serif" fill="${accent}" letter-spacing="-1">${name}</text>
  <text x="110" y="72" font-size="10" font-family="Arial, sans-serif" fill="#9ba3b8" letter-spacing="3">BRAND</text>
</svg>`;

    const logoData = { svgContent, accent, bg, name };
    cacheSet(cKey, logoData);
    renderLogo(logoData);
    setLoading("logo", false);
  }, 300);
}

function renderLogo({ svgContent, accent, name }) {
  const el = $("result-logo");
  el.innerHTML = `
    <div class="logo-result">
      ${svgContent}
      <div class="logo-actions">
        <button onclick="downloadSVG(${JSON.stringify(svgContent).replace(/'/g,"\\'")},'brandforge-logo.svg')">⬇ SVG</button>
        <button onclick="copyText(${JSON.stringify(svgContent)})">⧉ Copy SVG</button>
      </div>
    </div>`;
}

function downloadSVG(content, filename) {
  const blob = new Blob([content], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  showToast("SVG downloaded ✓");
}

/* ===========================
   TOOL: Color Palette (no API)
   =========================== */
function generateColors() {
  const ctx = getContext();
  if (!ctx) return;

  const cKey = buildCacheKey("colors");
  const cached = cacheGet(cKey);
  if (cached) { renderColors(cached); return; }

  setLoading("colors", true);

  setTimeout(() => {
    const toneMap = {
      professional: { base: [30, 120, 200], name: "Trust Blue" },
      friendly:     { base: [255, 145, 77], name: "Warm Coral" },
      bold:         { base: [139, 92, 246], name: "Bold Violet" },
      minimal:      { base: [14, 165, 233], name: "Sky Blue" },
      playful:      { base: [236, 72, 153], name: "Vivid Pink" },
    };
    const tm = toneMap[ctx.tone] || toneMap.professional;
    const [r, g, b] = tm.base;
    const palettes = [
      { hex: rgbToHex(r, g, b), label: "Primary" },
      { hex: rgbToHex(Math.min(255,r+40), Math.min(255,g+40), Math.min(255,b+40)), label: "Light" },
      { hex: rgbToHex(Math.max(0,r-40), Math.max(0,g-40), Math.max(0,b-40)), label: "Dark" },
      { hex: rgbToHex(255-r, 255-g, Math.min(255,b+80)), label: "Accent" },
      { hex: "#f8fafc", label: "Surface" },
      { hex: "#0f172a", label: "Text" },
    ];
    cacheSet(cKey, palettes);
    renderColors(palettes);
    setLoading("colors", false);
  }, 200);
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, "0")).join("");
}

function renderColors(palettes) {
  const el = $("result-colors");
  el.innerHTML = `
    <div class="color-palette">
      ${palettes.map(p => `
        <div class="color-swatch" onclick="copyText('${p.hex}')" title="Copy ${p.hex}">
          <div class="color-swatch-box" style="background:${p.hex}"></div>
          <span class="color-label">${p.label}</span>
          <span>${p.hex}</span>
        </div>`).join("")}
    </div>
    <button class="result-copy-btn" onclick="copyText('${palettes.map(p=>p.hex).join(", ")}')">⧉ Copy All Hex Codes</button>`;
}

/* ===========================
   TOOL: LinkedIn Bio
   =========================== */
async function generateLinkedin() {
  const ctx = getContext();
  if (!ctx) return;
  const cKey = buildCacheKey("linkedin");
  const cached = cacheGet(cKey);
  if (cached) { renderText("linkedin", cached); return; }
  setLoading("linkedin", true);
  try {
    const prompt = `Write a professional LinkedIn company description (150 words max) for a ${ctx.tone} ${ctx.industry} startup that: ${ctx.desc}. Target audience: ${ctx.audience}. No hashtags. Return only the description.`;
    const text = await groq(prompt, 250);
    cacheSet(cKey, text);
    renderText("linkedin", text);
  } catch (e) {
    $("result-linkedin").innerHTML = `<div class="result-text">⚠ ${e.message}</div>`;
  }
  setLoading("linkedin", false);
}

/* ===========================
   TOOL: SEO Description
   =========================== */
async function generateSEO() {
  const ctx = getContext();
  if (!ctx) return;
  const cKey = buildCacheKey("seo");
  const cached = cacheGet(cKey);
  if (cached) { renderText("seo", cached); return; }
  setLoading("seo", true);
  try {
    const prompt = `Write an SEO meta description (155 chars max) for a ${ctx.industry} startup: ${ctx.desc}. Keywords: ${ctx.keywords || ctx.industry}. Return only the meta description, no quotes.`;
    const text = await groq(prompt, 100);
    cacheSet(cKey, text);
    renderText("seo", text);
  } catch (e) {
    $("result-seo").innerHTML = `<div class="result-text">⚠ ${e.message}</div>`;
  }
  setLoading("seo", false);
}

/* ---- Render generic text result ---- */
function renderText(id, text) {
  $(`result-${id}`).innerHTML = `
    <div class="result-text">${escapeHtml(text)}</div>
    <button class="result-copy-btn" onclick="copyText(${JSON.stringify(text)})">⧉ Copy to Clipboard</button>`;
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ===========================
   TOOL: Landing Page Generator
   =========================== */
async function generateLanding() {
  const ctx = getContext();
  if (!ctx) return;
  const cKey = buildCacheKey("landing");
  const cached = cacheGet(cKey);
  if (cached) { renderLanding(cached); return; }
  setLoading("landing", true);
  try {
    const prompt = `Create a startup landing page as a JSON object with these fields: title (company name), tagline (hero headline 6 words max), subheadline (20 words), feature1_title, feature1_desc (15 words), feature2_title, feature2_desc, feature3_title, feature3_desc, cta_text (4 words). For a ${ctx.tone} ${ctx.industry} startup: ${ctx.desc}. Return only valid JSON, no extra text.`;
    const raw = await groq(prompt, 400);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);
    const html = buildLandingHTML(data, ctx);
    cacheSet(cKey, html);
    renderLanding(html);
  } catch (e) {
    $("result-landing").innerHTML = `<div class="result-text">⚠ ${e.message}. Try again.</div>`;
  }
  setLoading("landing", false);
}

function buildLandingHTML(d, ctx) {
  const toneColors = {
    professional: { primary: "#0ea5e9", dark: "#0f172a" },
    friendly:     { primary: "#f97316", dark: "#1c0f00" },
    bold:         { primary: "#8b5cf6", dark: "#0f0a1e" },
    minimal:      { primary: "#06b6d4", dark: "#0c1a1e" },
    playful:      { primary: "#ec4899", dark: "#1a0010" },
  };
  const colors = toneColors[ctx.tone] || toneColors.professional;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${d.title || "Startup"}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;background:${colors.dark};color:#f0f2f8;line-height:1.6}
  .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;
    background:linear-gradient(135deg,${colors.dark} 0%,${colors.primary}22 100%)}
  h1{font-size:clamp(2rem,6vw,4rem);font-weight:900;letter-spacing:-0.02em;margin-bottom:1rem;
    background:linear-gradient(135deg,#fff,${colors.primary});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .sub{font-size:1.2rem;color:#9ba3b8;max-width:560px;margin:0 auto 2.5rem}
  .btn{display:inline-block;padding:.9rem 2.5rem;background:${colors.primary};color:#fff;border-radius:10px;
    font-size:1rem;font-weight:700;text-decoration:none;transition:.2s}
  .btn:hover{opacity:.9;transform:translateY(-2px)}
  .features{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;padding:5rem 2rem;max-width:1100px;margin:0 auto}
  @media(max-width:700px){.features{grid-template-columns:1fr}}
  .feature{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem}
  .feature h3{font-size:1.1rem;font-weight:700;margin-bottom:.5rem;color:${colors.primary}}
  .feature p{font-size:.9rem;color:#9ba3b8;line-height:1.7}
  footer{text-align:center;padding:2rem;border-top:1px solid rgba(255,255,255,.08);color:#5a6278;font-size:.85rem}
  footer span{color:${colors.primary}}
  nav{display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem;position:fixed;top:0;left:0;right:0;background:${colors.dark}cc;backdrop-filter:blur(20px);z-index:10;border-bottom:1px solid rgba(255,255,255,.06)}
  nav a{font-weight:700;font-size:1.1rem;background:linear-gradient(135deg,#fff,${colors.primary});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
</style>
</head>
<body>
<nav>
  <a href="#">${d.title || "Brand"}</a>
  <a class="btn" href="#" style="font-size:.85rem;padding:.5rem 1.25rem;-webkit-text-fill-color:#fff">${d.cta_text || "Get Started"}</a>
</nav>
<section class="hero" style="padding-top:6rem">
  <div>
    <h1>${d.tagline || d.title}</h1>
    <p class="sub">${d.subheadline || ctx.desc}</p>
    <a href="#" class="btn">${d.cta_text || "Get Started Free"}</a>
  </div>
</section>
<div class="features">
  <div class="feature"><h3>${d.feature1_title || "Feature One"}</h3><p>${d.feature1_desc || ""}</p></div>
  <div class="feature"><h3>${d.feature2_title || "Feature Two"}</h3><p>${d.feature2_desc || ""}</p></div>
  <div class="feature"><h3>${d.feature3_title || "Feature Three"}</h3><p>${d.feature3_desc || ""}</p></div>
</div>
<footer><p>© 2025 <span>${d.title || "Brand"}</span>. Built with BrandForge AI.</p></footer>
</body>
</html>`;
}

function renderLanding(html) {
  const el = $("result-landing");
  const blob = new Blob([html], { type: "text/html" });
  const blobURL = URL.createObjectURL(blob);
  el.innerHTML = `
    <div class="landing-result">
      <div class="landing-actions">
        <button class="btn btn-tool btn-primary" onclick="downloadLanding()">⬇ Download HTML</button>
        <button class="btn btn-tool" onclick="previewLanding()">👁 Preview</button>
        <button class="btn btn-tool" onclick="copyLanding()">⧉ Copy Code</button>
      </div>
      <iframe class="landing-preview" id="landingPreview" src="${blobURL}" title="Landing page preview" sandbox="allow-scripts"></iframe>
    </div>`;
  // Store for download
  window._landingHTML = html;
}

function downloadLanding() {
  if (!window._landingHTML) return;
  const blob = new Blob([window._landingHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "landing-page.html"; a.click();
  URL.revokeObjectURL(url);
  showToast("Landing page downloaded ✓");
}

function previewLanding() {
  if (!window._landingHTML) return;
  const win = window.open("", "_blank");
  win.document.write(window._landingHTML);
  win.document.close();
}

function copyLanding() {
  if (!window._landingHTML) return;
  copyText(window._landingHTML);
}

/* ===========================
   BUTTON EVENT BINDINGS
   =========================== */
const actionMap = {
  names:   generateNames,
  slogans: generateSlogans,
  logo:    generateLogo,
  colors:  generateColors,
  linkedin:generateLinkedin,
  seo:     generateSEO,
  landing: generateLanding,
};

document.querySelectorAll("[data-action]").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.getAttribute("data-action");
    if (actionMap[action]) actionMap[action]();
  });
});

/* ---- Animate cards on scroll ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = "1";
      e.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".tool-card, .step-card, .faq-item").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  observer.observe(el);
});

/* ---- Restore cached results on load ---- */
window.addEventListener("DOMContentLoaded", () => {
  // Restore landing HTML ref if user reloads and had cached result
  const lKey = buildCacheKey("landing");
  const cachedLanding = cacheGet(lKey);
  if (cachedLanding) window._landingHTML = cachedLanding;
});
