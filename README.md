# 🌉 BridgeAI — Universal Intent-to-Action Translator

> **Transform chaos into clarity.** Throw any unstructured input — voice, photos, documents, text — and get structured, verified, life-saving actions powered by Google Gemini.

## 🏗️ Architecture

```
Client (Next.js App Router)
  ├── Multi-modal Input (text, voice, camera, file upload)
  ├── InputPanel → POST /api/bridge
  └── ResultsPanel (actions, map, warnings, verification)

Server (Next.js API Routes)
  ├── /api/bridge — Rate-limited, validated, Gemini-processed
  ├── /api/health — Health check for Cloud Run
  └── Security: CSP headers, input sanitization, server-side keys
  
AI (Google Gemini 2.0 Flash)
  ├── Multimodal analysis (text + images)
  ├── Structured JSON output (Zod-validated)
  └── Severity assessment + actionable recommendations

Map (OpenStreetMap via Leaflet)
  └── Dark-themed map with location markers
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your Gemini API key
cp .env.example .env.local
# Edit .env.local and add your key from https://aistudio.google.com/apikey

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## 📊 Judging Criteria Coverage

| Criteria | Implementation |
|----------|---------------|
| **Code Quality** | TypeScript strict mode, Zod schemas on all boundaries, clean architecture, ESLint |
| **Security** | Server-side API keys, input sanitization, rate limiting, CSP headers, file validation |
| **Efficiency** | Gemini Flash (fastest), image compression, lazy loading, standalone build |
| **Testing** | Vitest unit tests for schemas, sanitization, rate limiting (>80% lib coverage) |
| **Accessibility** | Semantic HTML, ARIA labels, keyboard nav, skip links, screen reader support, reduced motion |
| **Google Services** | Gemini 2.0 Flash API, structured output, multimodal analysis, Cloud Run deployment |

## 🔒 Security Features

- ✅ API keys server-side only (`env.local`, never in client bundle)
- ✅ Input sanitization (HTML stripping, null byte removal)
- ✅ File upload validation (MIME type, size limits)
- ✅ Rate limiting (10 req/min per IP)
- ✅ Security headers (X-Frame-Options, CSP, nosniff)
- ✅ Zod validation on all data boundaries
- ✅ Non-root Docker user

## ♿ Accessibility

- ✅ Skip-to-content link
- ✅ Semantic HTML landmarks (`<main>`, `<header>`, `<footer>`, `<nav>`)
- ✅ ARIA labels on all interactive elements
- ✅ `aria-live` regions for dynamic content
- ✅ Keyboard-navigable (Tab, Enter, Escape)
- ✅ Visible focus indicators
- ✅ `prefers-reduced-motion` respected
- ✅ WCAG AA color contrast (4.5:1)
- ✅ Voice input as a primary interaction mode
- ✅ Screen-reader-friendly map with text fallback list

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Vanilla CSS
- **AI:** Google Gemini 2.0 Flash (Structured Output)
- **Validation:** Zod
- **Maps:** Leaflet + OpenStreetMap (CartoDB dark tiles)
- **Testing:** Vitest
- **Deployment:** Docker + Google Cloud Run

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/bridge/       # Main AI endpoint
│   ├── api/health/       # Health check
│   ├── globals.css       # Design system
│   ├── layout.tsx        # Root layout + SEO
│   └── page.tsx          # Main page
├── components/           # React components
│   ├── InputPanel.tsx    # Multi-modal input
│   ├── ResultsPanel.tsx  # Structured output display
│   ├── ActionCard.tsx    # Individual action items
│   ├── MapView.tsx       # OpenStreetMap integration
│   ├── Header.tsx        # App header
│   ├── ProcessingIndicator.tsx
│   └── ErrorBoundary.tsx
├── hooks/                # Custom React hooks
│   ├── useBridge.ts      # API interaction
│   ├── useVoiceInput.ts  # Web Speech API
│   └── useGeolocation.ts # Browser geolocation
├── lib/                  # Core utilities
│   ├── gemini.ts         # Gemini API client
│   ├── schemas.ts        # Zod schemas
│   ├── sanitize.ts       # Input sanitization
│   ├── rate-limit.ts     # Rate limiting
│   └── constants.ts      # App constants
└── types/                # TypeScript types
    └── index.ts
```

## License

MIT
