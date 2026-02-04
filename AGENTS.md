# AGENTS.md - Vinscripted

Guidelines for AI coding agents working in this repository.

## Project Overview

Vinscripted is a Chrome Extension + Node.js serverless backend that generates optimized Vinted listing descriptions using Google Gemini AI. The extension analyzes product photos and auto-fills title, description, and keywords.

**Architecture:**
- `extension/` - Chrome Extension (Manifest V3, vanilla JavaScript)
- `backend/` - Vercel serverless API (Node.js)

## Build & Development Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm start                # Run local dev server (vercel dev)
npm run deploy           # Deploy to Vercel production
```

### Extension
No build step required - load directly in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" → "Load unpacked" → Select `extension/` folder

### Testing
**No test framework configured.** If adding tests:
```bash
cd backend && npm install --save-dev jest
# Run single test: npx jest path/to/test.test.js
# Run with pattern: npx jest --testNamePattern="test name"
```

### Linting
**No linter configured.** Follow the code style conventions below.

## Code Style Guidelines

### Formatting
- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Single quotes for strings
- **Semicolons:** Required
- **Line length:** ~100 characters max

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `isAnalyzing`, `handleGenerateClick` |
| Constants | UPPER_SNAKE_CASE | `MAX_IMAGES`, `RATE_LIMIT` |
| CSS Classes | kebab-case + prefix | `vdg-modal`, `vdg-btn-primary` |
| HTML IDs | kebab-case + prefix | `vinted-desc-generator-btn` |

### JavaScript Patterns
```javascript
// ES6+ always: const/let (never var), arrow functions, async/await
const MAX_IMAGES = 10;
let isAnalyzing = false;
const { images, language = 'fr' } = req.body;
images.map(img => ({ mimeType: img.mimeType }));

// Console logging with prefix
console.log('[Vinscripted] Content script loaded');
```

**Content Scripts:** Use IIFE pattern with strict mode
```javascript
(function() {
  'use strict';
  // Content script code here
})();
```

### Imports
**Backend (CommonJS):**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
```
**Extension:** No module system - vanilla JS with IIFE for scope management.

### Error Handling
**Backend:** Return French error messages
```javascript
try {
  // Operation
} catch (error) {
  console.error('API Error:', error);
  return res.status(500).json({ error: getErrorMessage(error) });
}
```

**Extension:** Show notifications
```javascript
try {
  // Operation
} catch (error) {
  console.error('[Vinscripted] Error:', error);
  showNotification('Erreur de connexion. Réessayez.', 'error');
}
```

### Security
- **XSS:** Use `escapeHtml()` for user content
- **Validation:** Validate all API inputs (images array, language code)
- **API Keys:** Never expose `GEMINI_API_KEY` in client code

### Type Validation (runtime)
```javascript
if (!images || !Array.isArray(images) || images.length === 0) {
  return res.status(400).json({ error: 'Veuillez fournir au moins une image' });
}
```

## API Contract

**Endpoint:** `POST /api/analyze`

**Request:**
```json
{ "images": ["data:image/jpeg;base64,..."], "language": "fr" }
```

**Response:**
```json
{
  "title": "Optimized title",
  "description": "Generated description",
  "attributes": { "category": "...", "condition": "...", "color": "...", "size": "...", "brand": "...", "material": "..." },
  "keywords": ["keyword1", "keyword2"]
}
```

**Constraints:** Max 10 images (5MB each), languages: fr/en/de/es/it/nl/pl/pt, rate limit: 10 req/min/IP

## Environment Variables

- `GEMINI_API_KEY` (required) - Google Gemini API key
- `ALLOWED_ORIGINS` (optional) - Comma-separated allowed CORS origins

## Key Files

| File | Purpose |
|------|---------|
| `backend/api/analyze.js` | Main API endpoint, Gemini integration |
| `extension/content/content.js` | Content script, UI injection |
| `extension/background/service-worker.js` | API calls, image fetching |
| `extension/popup/popup.js` | Settings management |
| `extension/manifest.json` | Extension configuration |

## Common Tasks

**Adding a new language:**
1. Add to `LANGUAGE_NAMES` in `backend/api/analyze.js`
2. Add option to `extension/popup/popup.html`

**Modifying the AI prompt:** Edit `buildPrompt()` in `backend/api/analyze.js`

**Adding new Vinted domains:**
1. Add to `host_permissions` in `extension/manifest.json`
2. Add to `content_scripts.matches` in `extension/manifest.json`
