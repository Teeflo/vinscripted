// Service Worker for Vinscripted
// Handles API calls to the backend

// Constants
const API_TIMEOUT = 60000; // 60 seconds (increased for image processing)
const MAX_RETRIES = 2;
const API_KEY = 'vsc_k8x2mP9qL4wN7jR3sY6tB1vC5zH0fE8a'; // Extension API key

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeImages') {
    handleAnalyzeImages(request, sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'fetchImage') {
    handleFetchImage(request, sendResponse);
    return true; // Keep channel open for async response
  }
});

// Handle image fetch request (fallback for CORS issues)
async function handleFetchImage(request, sendResponse) {
  const { url } = request;
  
  try {
    console.log('[Vinscripted] Fetching image:', url.substring(0, 60) + '...');
    
    const response = await fetch(url, {
      credentials: 'omit',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    
    sendResponse({
      success: true,
      base64: base64
    });
  } catch (error) {
    console.error('[Vinscripted] Fetch image error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Handle image analysis request
async function handleAnalyzeImages(request, sendResponse) {
  const { images, language, backendUrl } = request;
  
  try {
    // Validate inputs
    if (!images || images.length === 0) {
      throw new Error('Aucune image fournie');
    }
    
    if (!backendUrl) {
      throw new Error('URL du backend non configurée');
    }
    
    console.log('[Vinscripted] Received', images.length, 'base64 images');
    
    // Call backend with retry logic
    const result = await callBackendWithRetry(images, language, backendUrl);
    
    sendResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Vinscripted] Backend error:', error);
    sendResponse({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse'
    });
  }
}

// Call backend with retry logic
async function callBackendWithRetry(images, language, backendUrl, retries = 0) {
  try {
    return await callBackend(images, language, backendUrl);
  } catch (error) {
    if (retries < MAX_RETRIES && isRetryableError(error)) {
      console.log(`[Vinscripted] Retry ${retries + 1}/${MAX_RETRIES}`);
      await delay(1000 * (retries + 1)); // Exponential backoff
      return callBackendWithRetry(images, language, backendUrl, retries + 1);
    }
    throw error;
  }
}

// Call the backend API
async function callBackend(images, language, backendUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    // Images are already base64, send directly
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        images: images.slice(0, 10), // Max 10 images
        language: language || 'fr'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Vinscripted] Backend error response:', errorData);
      // Ensure error message is a string
      let errorMsg = `Erreur HTTP ${response.status}: ${response.statusText}`;
      if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMsg = errorData.error;
        } else if (errorData.error.message) {
          errorMsg = errorData.error.message;
        }
      }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log('[Vinscripted] Backend success response:', data);
    
    // Validate response structure
    if (!data.description) {
      throw new Error('Réponse invalide du serveur');
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré. Veuillez réessayer.');
    }
    
    throw error;
  }
}

// Check if error is retryable
function isRetryableError(error) {
  const retryableErrors = [
    'network',
    'timeout',
    'fetch',
    'connection',
    '503',
    '502',
    '504'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return retryableErrors.some(type => errorMessage.includes(type));
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Installation event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Vinscripted] Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      language: 'fr',
      backendUrl: 'https://backend-teeflo.vercel.app'
    });
  } else if (details.reason === 'update') {
    console.log('[Vinscripted] Extension updated');
  }
});
