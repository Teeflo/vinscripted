const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VINSCRIPTED_API_KEY = process.env.VINSCRIPTED_API_KEY; // Secret key for extension auth
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Language display names
const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português'
};

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  // Chrome extensions (any extension can call, but combined with other checks)
  'chrome-extension://',
  // Vinted domains
  'https://www.vinted.fr',
  'https://www.vinted.be',
  'https://www.vinted.es',
  'https://www.vinted.de',
  'https://www.vinted.it',
  'https://www.vinted.nl',
  'https://www.vinted.pl',
  'https://www.vinted.pt',
  'https://www.vinted.co.uk',
  'https://www.vinted.com'
];

// Check if origin is allowed
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  // Allow Chrome extensions
  if (origin.startsWith('chrome-extension://')) {
    return true;
  }
  
  // Check against allowed list
  return ALLOWED_ORIGINS.includes(origin);
}

// Get CORS headers for a request
function getCorsHeaders(origin) {
  const allowedOrigin = isOriginAllowed(origin) ? origin : ALLOWED_ORIGINS[1]; // Default to vinted.fr
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-API-Key',
    'Access-Control-Max-Age': '86400'
  };
}

// Validate API key from request
function isValidApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  
  // If no VINSCRIPTED_API_KEY is set, skip validation (dev mode)
  if (!VINSCRIPTED_API_KEY) {
    console.warn('[Auth] VINSCRIPTED_API_KEY not configured - skipping validation');
    return true;
  }
  
  return apiKey === VINSCRIPTED_API_KEY;
}

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Main handler
module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check origin for non-preflight requests
  if (!isOriginAllowed(origin)) {
    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    return res.status(403).json({
      error: 'Origine non autorisée'
    });
  }

  // Validate API key
  if (!isValidApiKey(req)) {
    console.warn(`[Auth] Invalid or missing API key from: ${origin}`);
    return res.status(401).json({
      error: 'Clé API invalide ou manquante'
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (isRateLimited(clientIP)) {
      return res.status(429).json({
        error: 'Trop de requêtes. Réessayez dans 1 minute.'
      });
    }

    // Validate API key
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({
        error: 'Configuration error'
      });
    }

    // Parse request body
    const { images, language = 'fr' } = req.body;

    // Validate inputs
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Veuillez fournir au moins une image'
      });
    }

    if (images.length > MAX_IMAGES) {
      return res.status(400).json({
        error: `Maximum ${MAX_IMAGES} images autorisées`
      });
    }

    // Validate language
    if (!LANGUAGE_NAMES[language]) {
      return res.status(400).json({
        error: 'Langue non supportée',
        supported: Object.keys(LANGUAGE_NAMES)
      });
    }

    // Process images
    const processedImages = await processImages(images);
    
    // Call Gemini API
    const result = await analyzeWithGemini(processedImages, language);

    // Return response
    return res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return user-friendly error
    return res.status(500).json({
      error: getErrorMessage(error)
    });
  }
};

// Check rate limit
function isRateLimited(clientIP) {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || (now - clientData.resetTime) > RATE_WINDOW) {
    // New window
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now
    });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return true;
  }
  
  clientData.count++;
  return false;
}

// Process and validate images
async function processImages(images) {
  return images.map((imageData, index) => {
    // Check if it's a valid base64 data URL
    if (!imageData.startsWith('data:image/')) {
      throw new Error(`Image ${index + 1} format invalide`);
    }

    // Extract mime type and base64 data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error(`Image ${index + 1} format invalide`);
    }

    const [, mimeType, base64Data] = matches;
    
    // Check size
    const sizeInBytes = Buffer.from(base64Data, 'base64').length;
    if (sizeInBytes > MAX_IMAGE_SIZE) {
      throw new Error(`Image ${index + 1} trop volumineuse (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
    }

    // Map to Gemini-supported mime types
    const geminiMimeType = mapMimeType(mimeType);
    
    return {
      mimeType: geminiMimeType,
      data: base64Data
    };
  });
}

// Map common mime types to Gemini-supported types
function mapMimeType(mimeType) {
  const mapping = {
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif'
  };
  
  return mapping[mimeType] || 'image/jpeg';
}

// Analyze images with Gemini
async function analyzeWithGemini(images, language) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' });

  // Build prompt
  const prompt = buildPrompt(language);

  // Prepare content parts
  const contentParts = [
    { text: prompt },
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    }))
  ];

  // Generate content
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: contentParts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    }
  });

  const response = await result.response;
  const text = response.text();

  // Parse JSON response
  return parseResponse(text, language);
}

// Build the optimized prompt
function buildPrompt(language) {
  const langName = LANGUAGE_NAMES[language];
  
  return `Tu es un expert en vente sur Vinted. Analyse les images fournies et génère une annonce complète et attractive.

RÈGLES IMPORTANTES :
1. TITRE : Crée un titre optimisé pour le SEO (Marque + Type + Couleur + Taille/État). Soyez précis.
2. DESCRIPTION : Rédige une description DÉTAILLÉE et complète. Ne sois pas trop bref. Structure ton texte avec des sauts de ligne.
   - Mentionne l'état précis (défauts, usure ou absence de défauts).
   - Décris la coupe, le style, les motifs, les détails (boutons, fermeture, poches).
   - Indique la matière et le ressenti (doux, léger, chaud...).
   - Donne des conseils de style ou d'occasion (idéal pour l'été, pour une soirée...).
3. Ton : Chaleureux, honnête et vendeur.
4. N'invente pas de marque si elle n'est pas visible.
5. Ne mentionne pas le prix.

LANGUE : ${langName}

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "title": "Titre optimisé de l'annonce",
  "description": "Description complète et structurée...",
  "attributes": {
    "category": "Type d'article détecté",
    "condition": "État de l'article",
    "color": "Couleur principale",
    "size": "Taille si visible",
    "brand": "Marque si visible",
    "material": "Matière si identifiable"
  },
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3", "mot-clé4", "mot-clé5"]
}

N'inclut aucun texte avant ou après le JSON.`;
}

// Parse and validate Gemini response
function parseResponse(text, language) {
  try {
    // Try to extract JSON from the response
    let jsonText = text;
    
    // Remove markdown code blocks if present
    if (text.includes('```json')) {
      const match = text.match(/```json\s*([\s\S]*?)```/);
      if (match) jsonText = match[1];
    } else if (text.includes('```')) {
      const match = text.match(/```\s*([\s\S]*?)```/);
      if (match) jsonText = match[1];
    }

    // Parse JSON
    const data = JSON.parse(jsonText);

    // Validate required fields
    if (!data.description) {
      throw new Error('Description manquante dans la réponse');
    }

    // Ensure title exists
    data.title = data.title || 'Article Vinted';

    // Ensure attributes exist with defaults
    data.attributes = data.attributes || {};
    data.attributes.category = data.attributes.category || 'Non détecté';
    data.attributes.condition = data.attributes.condition || 'Non détecté';
    data.attributes.color = data.attributes.color || 'Non détecté';
    data.attributes.size = data.attributes.size || 'Non détecté';
    data.attributes.brand = data.attributes.brand || 'Non détecté';
    data.attributes.material = data.attributes.material || 'Non détecté';

    // Ensure keywords exist
    data.keywords = data.keywords || [];
    if (!Array.isArray(data.keywords)) {
      data.keywords = [];
    }

    return data;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.log('Raw response:', text);
    
    // Fallback: return the raw text as description
    return {
      title: 'Article à vendre',
      description: text.substring(0, 1000),
      attributes: {
        category: 'Non détecté',
        condition: 'Non détecté',
        color: 'Non détecté',
        size: 'Non détecté',
        brand: 'Non détecté',
        material: 'Non détecté'
      },
      keywords: []
    };
  }
}

// Get user-friendly error message
function getErrorMessage(error) {
  const message = error.message || '';
  
  if (message.includes('API key')) {
    return 'Erreur de configuration du service';
  }
  if (message.includes('rate limit') || message.includes('quota')) {
    return 'Limite de requêtes atteinte. Réessayez plus tard.';
  }
  if (message.includes('timeout')) {
    return 'Le service met trop de temps à répondre. Réessayez.';
  }
  if (message.includes('format')) {
    return message;
  }
  
  return 'Erreur lors de l\'analyse. Veuillez réessayer.';
}
