<p align="center">
  <img src="extension/icons/icon128.png" alt="Vinscripted Logo" width="128" height="128">
</p>

<h1 align="center">Vinscripted</h1>

<p align="center">
  <strong>AI-powered product description generator for Vinted sellers</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.1-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/manifest-v3-orange.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4.svg" alt="Google Gemini">
</p>

---

## Overview

Vinscripted is a Chrome Extension (Manifest V3) with a Vercel serverless backend that leverages **Google Gemini AI** to automatically generate optimized product descriptions for Vinted listings.

| Component | Technology |
|-----------|------------|
| Extension | Vanilla JavaScript, Chrome Manifest V3 |
| Backend | Node.js 18+, Vercel Serverless Functions |
| AI Model | Google Gemini (`gemma-3-27b-it`) |

### How It Works

1. User adds photos to a Vinted listing
2. Extension detects photos and displays a floating "Generate" button
3. On click, photos are converted to base64 and sent to the backend
4. Backend processes images through Gemini AI
5. Generated title, description, and keywords are auto-filled into the form

---

## Features

- **AI-Powered Descriptions** — Analyzes product photos and generates detailed, SEO-optimized descriptions
- **Multi-Language Support** — 8 languages (FR, EN, DE, ES, IT, NL, PL, PT)
- **Auto Photo Detection** — MutationObserver + polling detects when photos are added
- **One-Click Generation** — Floating button appears automatically on listing pages
- **Auto-Fill Forms** — Inserts generated content directly into Vinted forms
- **SEO Keywords** — Generates hashtag keywords appended to descriptions
- **Rate Limiting** — 10 requests/minute per IP for API protection
- **GDPR Compliant** — No data storage, images processed in memory only

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Chrome)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐    │
│   │   Popup UI      │      │  Content Script │      │ Service Worker  │    │
│   │   (Settings)    │      │  (Vinted Pages) │      │  (Background)   │    │
│   │                 │      │                 │      │                 │    │
│   │ • Language      │      │ • Photo detect  │      │ • API calls     │    │
│   │   selector      │      │ • Floating btn  │      │ • Retry logic   │    │
│   │                 │      │ • Form filling  │      │ • Timeout mgmt  │    │
│   └────────┬────────┘      └────────┬────────┘      └────────┬────────┘    │
│            │                        │                        │             │
│            └────────────────────────┼────────────────────────┘             │
│                                     │ chrome.runtime.sendMessage           │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL SERVERLESS BACKEND                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      POST /api/analyze                              │  │
│   │                                                                     │  │
│   │  1. Validate API Key (X-API-Key header)                            │  │
│   │  2. Check CORS origin whitelist                                    │  │
│   │  3. Rate limiting (10 req/min/IP)                                  │  │
│   │  4. Process base64 images (max 10, 5MB each)                       │  │
│   │  5. Call Google Gemini API                                         │  │
│   │  6. Return structured JSON response                                │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │ API Request
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GOOGLE GEMINI API                                 │
│                                                                             │
│                        Model: gemma-3-27b-it                                │
│                   Multimodal image + text analysis                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
vinscripted/
├── README.md                          # This file
├── LICENSE                            # MIT License
├── AGENTS.md                          # Coding agent guidelines & style guide
├── CHROME_WEBSTORE_LISTING.md         # Chrome Web Store listing content
│
├── extension/                         # Chrome Extension (no build step)
│   ├── manifest.json                  # Manifest V3 configuration
│   ├── PRIVACY_POLICY.md              # Privacy policy document
│   │
│   ├── popup/                         # Extension popup (settings)
│   │   ├── popup.html                 # Popup markup
│   │   ├── popup.js                   # Settings logic (language selector)
│   │   └── popup.css                  # Popup styles
│   │
│   ├── content/                       # Content scripts (injected on Vinted)
│   │   ├── content.js                 # Main logic: photo detection, UI, API
│   │   └── content.css                # Floating button, notifications, modal
│   │
│   ├── background/                    # Service worker
│   │   └── service-worker.js          # API calls, retry logic, timeout
│   │
│   ├── icons/                         # Extension icons
│   │   ├── icon16.png                 # Toolbar icon
│   │   ├── icon32.png                 # Retina toolbar
│   │   ├── icon48.png                 # Extension page
│   │   ├── icon128.png                # Chrome Web Store
│   │   └── README.md                  # Icon creation guide
│   │
│   └── store_assets/                  # Chrome Web Store screenshots
│
└── backend/                           # Vercel Serverless Backend
    ├── package.json                   # Dependencies & scripts
    ├── vercel.json                    # Vercel configuration
    ├── .env.example                   # Environment variables template
    └── api/
        └── analyze.js                 # POST /api/analyze endpoint
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **Chrome** browser
- **Vercel CLI** (optional, for deployment)
- **Google Gemini API key**

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/vinscripted.git
cd vinscripted/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API keys
# GEMINI_API_KEY=your_google_gemini_api_key
# VINSCRIPTED_API_KEY=your_custom_api_key_for_extension

# Start local development server
npm start

# Deploy to production
npm run deploy
```

### Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The Vinscripted icon appears in your toolbar

> **Note:** For local development, update `DEFAULT_SETTINGS.backendUrl` in `content.js` to `http://localhost:3000`

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VINSCRIPTED_API_KEY` | API key for extension authentication | Yes |

### Backend Constants

```javascript
// api/analyze.js
const MAX_IMAGES = 10;                    // Maximum photos per request
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB per image
const RATE_LIMIT = 10;                    // Requests per minute per IP
const RATE_WINDOW = 60 * 1000;            // Rate limit window (1 minute)
```

### Extension Constants

```javascript
// service-worker.js
const API_TIMEOUT = 60000;                // 60 seconds timeout
const MAX_RETRIES = 2;                    // Retry count for failed requests

// content.js
const DEFAULT_SETTINGS = {
  language: 'fr',
  backendUrl: 'https://backend-teeflo.vercel.app'
};
```

---

## API Reference

### POST /api/analyze

Analyzes product images and generates a description.

#### Request

```http
POST /api/analyze HTTP/1.1
Host: your-backend.vercel.app
Content-Type: application/json
X-API-Key: your_api_key
Origin: https://www.vinted.fr

{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZ...",
    "data:image/jpeg;base64,/9j/4AAQSkZ..."
  ],
  "language": "fr"
}
```

#### Response

```json
{
  "success": true,
  "title": "Nike Air Max 90 - Sneakers blanches - Taille 42",
  "description": "Sneakers Nike Air Max 90 en excellent etat...",
  "attributes": {
    "category": "Chaussures",
    "condition": "Tres bon etat",
    "color": "Blanc",
    "size": "42",
    "brand": "Nike",
    "material": "Cuir synthetique"
  },
  "keywords": ["nike", "airmax", "sneakers", "chaussures", "vintage"]
}
```

#### Error Response

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

#### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (missing images, invalid format) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (CORS origin not allowed) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

---

## Security

### Implemented Measures

| Feature | Implementation |
|---------|----------------|
| **XSS Protection** | HTML escaping via `escapeHtml()` function |
| **API Authentication** | `X-API-Key` header validation |
| **CORS Protection** | Origin whitelist validation |
| **Rate Limiting** | 10 requests/minute per IP (in-memory) |
| **Input Validation** | Image size limits, format validation |

### Allowed Origins

```javascript
const ALLOWED_ORIGINS = [
  'https://www.vinted.fr',
  'https://www.vinted.be',
  'https://www.vinted.es',
  'https://www.vinted.de',
  'https://www.vinted.it',
  'https://www.vinted.nl',
  'https://www.vinted.pl',
  'https://www.vinted.pt',
  'https://www.vinted.co.uk',
  'https://www.vinted.com',
  'chrome-extension://*'
];
```

---

## Supported Platforms

### Vinted Domains

| Domain | Country |
|--------|---------|
| vinted.fr | France |
| vinted.be | Belgium |
| vinted.es | Spain |
| vinted.de | Germany |
| vinted.it | Italy |
| vinted.nl | Netherlands |
| vinted.pl | Poland |
| vinted.pt | Portugal |
| vinted.co.uk | United Kingdom |
| vinted.com | International |

### Languages

| Code | Language |
|------|----------|
| `fr` | Francais (default) |
| `en` | English |
| `de` | Deutsch |
| `es` | Espanol |
| `it` | Italiano |
| `nl` | Nederlands |
| `pl` | Polski |
| `pt` | Portugues |

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Code Style

See [`AGENTS.md`](AGENTS.md) for detailed coding guidelines, including:

- **Naming conventions**: camelCase for functions/variables, UPPER_SNAKE_CASE for constants
- **CSS classes**: BEM-like with `vdg-` prefix
- **Error handling**: Always use try-catch with async/await
- **Logging**: Use `[Vinscripted]` prefix for console messages

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Test locally with the extension loaded unpacked
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Tips

```bash
# Backend local development
cd backend && npm start

# Watch extension changes
# Simply reload the extension in chrome://extensions/ after changes

# Test API endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"images": ["data:image/jpeg;base64,..."], "language": "en"}'
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Google Gemini** — AI model powering the description generation
- **Vercel** — Serverless hosting platform
- **Vinted** — Target marketplace platform

---

<p align="center">
  <strong>Vinscripted is not affiliated with Vinted. It is an independent tool created to help sellers.</strong>
</p>

<p align="center">
  Made with care for the Vinted seller community
</p>
