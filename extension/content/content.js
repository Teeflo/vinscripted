// Content script for Vinscripted
// Runs on Vinted item creation pages

(function() {
  'use strict';

  // Default settings
  const DEFAULT_SETTINGS = {
    language: 'fr',
    backendUrl: 'https://backend-teeflo.vercel.app'
  };

  // Translations for button text
  const TRANSLATIONS = {
    fr: {
      generate: 'Generer la description',
      analyzing: 'Analyse en cours...',
      addPhotos: 'Ajoutez d\'abord des photos',
      photoCount: (n) => `Generer (${n} photo${n > 1 ? 's' : ''})`
    },
    en: {
      generate: 'Generate description',
      analyzing: 'Analyzing...',
      addPhotos: 'Add photos first',
      photoCount: (n) => `Generate (${n} photo${n > 1 ? 's' : ''})`
    },
    de: {
      generate: 'Beschreibung generieren',
      analyzing: 'Analyse lauft...',
      addPhotos: 'Zuerst Fotos hinzufugen',
      photoCount: (n) => `Generieren (${n} Foto${n > 1 ? 's' : ''})`
    },
    es: {
      generate: 'Generar descripcion',
      analyzing: 'Analizando...',
      addPhotos: 'Anade fotos primero',
      photoCount: (n) => `Generar (${n} foto${n > 1 ? 's' : ''})`
    },
    it: {
      generate: 'Genera descrizione',
      analyzing: 'Analisi in corso...',
      addPhotos: 'Aggiungi prima le foto',
      photoCount: (n) => `Genera (${n} foto)`
    },
    nl: {
      generate: 'Beschrijving genereren',
      analyzing: 'Bezig met analyseren...',
      addPhotos: 'Voeg eerst foto\'s toe',
      photoCount: (n) => `Genereren (${n} foto${n > 1 ? '\'s' : ''})`
    },
    pl: {
      generate: 'Generuj opis',
      analyzing: 'Analizowanie...',
      addPhotos: 'Najpierw dodaj zdjecia',
      photoCount: (n) => `Generuj (${n} zdjec${n > 1 ? 'ia' : 'ie'})`
    },
    pt: {
      generate: 'Gerar descricao',
      analyzing: 'Analisando...',
      addPhotos: 'Adicione fotos primeiro',
      photoCount: (n) => `Gerar (${n} foto${n > 1 ? 's' : ''})`
    }
  };

  // Current language
  let currentLanguage = 'fr';

  // HTML escape function for XSS protection
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // State
  let floatingButton = null;
  let modal = null;
  let isAnalyzing = false;
  let observer = null;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log('[Vinscripted] Content script loaded');
    
    // Load language setting
    loadLanguage();
    
    // Create button element
    createButtonElement();
    
    // Initial injection attempt
    injectButton();
    
    // Start observing for photo uploads
    observePhotos();
    
    // Periodic check for button injection and state
    setInterval(() => {
      injectButton();
      updateButtonState();
    }, 1000);
  }

  // Load language from storage
  function loadLanguage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['language'], (result) => {
          if (!chrome.runtime.lastError && result.language) {
            currentLanguage = result.language;
            updateButtonState();
          }
        });
        
        // Listen for language changes
        chrome.storage.onChanged.addListener((changes) => {
          if (changes.language) {
            currentLanguage = changes.language.newValue;
            updateButtonState();
          }
        });
      }
    } catch (e) {
      console.warn('[Vinscripted] Could not load language:', e);
    }
  }

  // Get translation for current language
  function t(key, ...args) {
    const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS.fr;
    const value = lang[key];
    if (typeof value === 'function') {
      return value(...args);
    }
    return value || TRANSLATIONS.fr[key];
  }

  // Create the button element (without inserting it)
  function createButtonElement() {
    if (floatingButton) return;

    floatingButton = document.createElement('div');
    floatingButton.id = 'vinted-desc-generator-btn';
    floatingButton.className = 'vdg-floating-btn';
    floatingButton.innerHTML = `
      <span class="vdg-btn-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
        </svg>
      </span>
      <span class="vdg-btn-text">${t('generate')}</span>
    `;
    
    floatingButton.addEventListener('click', handleGenerateClick);
  }

  // Find the description textarea
  function findDescriptionField() {
    const selectors = [
      'textarea[name="description"]',
      '#description',
      '[data-testid="description-input"]',
      'textarea[placeholder*="description" i]',
      'textarea[placeholder*="décrit" i]',
      'textarea[placeholder*="Décris" i]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  // Find the title input
  function findTitleField() {
    const selectors = [
      'input[name="title"]',
      '#title',
      '[data-testid="title-input"]',
      'input[placeholder*="titre" i]',
      'input[placeholder*="Titre" i]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  // Inject button into the description field container
  function injectButton() {
    if (!floatingButton) createButtonElement();

    const textarea = findDescriptionField();
    if (textarea && textarea.parentElement) {
      const parent = textarea.parentElement;
      
      // If button is not already in this parent
      if (floatingButton.parentElement !== parent) {
        // Ensure parent is positioned relatively so absolute positioning works
        const style = window.getComputedStyle(parent);
        if (style.position === 'static') {
          parent.style.position = 'relative';
        }
        
        // Append button
        parent.appendChild(floatingButton);
      }
    } else {
      // If description field not found, remove button from DOM
      if (floatingButton.parentElement) {
        floatingButton.remove();
      }
    }
  }

  // Observe photo uploads on the page
  function observePhotos() {
    // Vinted uses React, so we need to observe DOM changes
    const photoContainer = document.querySelector('[data-testid="photos-container"]') || 
                          document.querySelector('.photos-container') ||
                          document.querySelector('[class*="photo"]');
    
    if (photoContainer) {
      observer = new MutationObserver(() => {
        updateButtonState();
      });
      
      observer.observe(photoContainer, {
        childList: true,
        subtree: true
      });
    }

    // Also set up a periodic check as fallback
    setInterval(updateButtonState, 2000);
  }

  // Update button state based on whether photos are present
  function updateButtonState() {
    if (!floatingButton) return;
    
    const photos = extractPhotoUrls();
    const textSpan = floatingButton.querySelector('.vdg-btn-text');
    
    if (photos.length === 0) {
      floatingButton.classList.add('vdg-disabled');
      floatingButton.title = t('addPhotos');
      if (textSpan) textSpan.textContent = t('generate');
    } else {
      floatingButton.classList.remove('vdg-disabled');
      floatingButton.title = t('photoCount', photos.length);
      if (textSpan) textSpan.textContent = t('photoCount', photos.length);
    }
  }

  // Extract photo URLs from the page
  function extractPhotoUrls() {
    const photos = [];
    const seenSrcs = new Set();
    
    // Try multiple selectors for Vinted's photo elements
    const selectors = [
      '[data-testid="photo-upload"] img',
      '.upload-dropzone img',
      '.photos-container img',
      '[class*="photo"] img[src*="vinted"]',
      'img[src*="images1.vinted"]',
      'img[src*="images.vinted"]'
    ];
    
    // Domains to exclude (not product images)
    const excludedDomains = [
      'cookielaw.org',
      'onetrust.com',
      'braze.eu',
      'google',
      'facebook',
      'analytics',
      'tracking',
      'cdn.vinted.net/assets', // Vinted UI assets
      'badge',
      'icon',
      'logo',
      'avatar'
    ];
    
    for (const selector of selectors) {
      const images = document.querySelectorAll(selector);
      images.forEach(img => {
        if (img.src && !img.src.includes('data:') && !seenSrcs.has(img.src)) {
          // Check if URL contains excluded domains
          const isExcluded = excludedDomains.some(domain => 
            img.src.toLowerCase().includes(domain.toLowerCase())
          );
          
          if (isExcluded) {
            console.log('[Vinscripted] Excluding image:', img.src.substring(0, 60));
            return;
          }
          
          // Must be from Vinted image servers
          if (!img.src.includes('vinted.net') && !img.src.includes('vinted.com')) {
            console.log('[Vinscripted] Excluding non-Vinted image:', img.src.substring(0, 60));
            return;
          }
          
          // Filter out small icons and placeholders (check actual dimensions)
          const width = img.naturalWidth || img.width || 0;
          const height = img.naturalHeight || img.height || 0;
          if (width > 100 && height > 100) {
            seenSrcs.add(img.src);
            photos.push(img.src);
            console.log('[Vinscripted] Found product image:', img.src.substring(0, 60) + '...');
          }
        }
      });
    }
    
    console.log('[Vinscripted] Total product images found:', photos.length);
    return photos.slice(0, 10); // Max 10 photos
  }

  // Load image with crossOrigin and convert to base64
  function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
      // Create a new image with crossOrigin
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(base64);
        } catch (err) {
          console.error('[Vinscripted] Canvas error:', err);
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Add cache-busting to force reload with CORS headers
      const separator = url.includes('?') ? '&' : '?';
      img.src = url + separator + '_cors=' + Date.now();
    });
  }

  // Convert all photos to base64
  async function convertPhotosToBase64() {
    const photoUrls = extractPhotoUrls();
    const base64Images = [];
    
    for (const url of photoUrls) {
      try {
        console.log('[Vinscripted] Converting:', url.substring(0, 60) + '...');
        const base64 = await loadImageAsBase64(url);
        base64Images.push(base64);
        console.log('[Vinscripted] Success!');
      } catch (error) {
        console.warn('[Vinscripted] Failed to convert, trying fetch fallback:', error.message);
        
        // Try fetch as fallback via service worker
        try {
          const response = await chrome.runtime.sendMessage({
            action: 'fetchImage',
            url: url
          });
          if (response && response.success) {
            base64Images.push(response.base64);
            console.log('[Vinscripted] Fallback success!');
          }
        } catch (fallbackError) {
          console.error('[Vinscripted] Fallback also failed:', fallbackError);
        }
      }
    }
    
    return base64Images;
  }

  // Handle generate button click
  async function handleGenerateClick() {
    if (isAnalyzing) return;
    
    const photos = extractPhotoUrls();
    if (photos.length === 0) {
      showNotification('Veuillez d\'abord ajouter des photos', 'error');
      return;
    }

    isAnalyzing = true;
    updateButtonToLoading();

    try {
      // Get settings safely
      const settings = await getSettings();
      
      // Convert photos to base64
      showNotification('Conversion des images...', 'info');
      const base64Images = await convertPhotosToBase64();
      
      if (base64Images.length === 0) {
        throw new Error('Impossible de convertir les images. Essayez de rafraîchir la page.');
      }
      
      console.log('[Vinscripted] Sending', base64Images.length, 'images to backend');
      showNotification('Analyse en cours...', 'info');
      
      // Send message to service worker with base64 images
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeImages',
        images: base64Images,
        language: settings.language,
        backendUrl: settings.backendUrl
      });

      console.log('[Vinscripted] Full response:', response);
      
      if (response && response.success) {
        console.log('[Vinscripted] Response data:', JSON.stringify(response.data, null, 2));
        // Direct insertion instead of modal
        fillListing(response.data);
      } else {
        // Ensure error is a string
        let errorMsg = 'Erreur lors de l\'analyse';
        if (response && response.error) {
          if (typeof response.error === 'string') {
            errorMsg = response.error;
          } else if (response.error.message) {
            errorMsg = response.error.message;
          } else {
            errorMsg = JSON.stringify(response.error);
          }
        }
        console.error('[Vinscripted] Error response:', response);
        showNotification(errorMsg, 'error');
      }
    } catch (error) {
      console.error('[Vinscripted] Catch error:', error);
      // Ensure error message is a string
      let errorMsg = 'Erreur de connexion. Réessayez.';
      if (error) {
        if (typeof error === 'string') {
          errorMsg = error;
        } else if (error.message && typeof error.message === 'string') {
          errorMsg = error.message;
        } else {
          errorMsg = JSON.stringify(error);
        }
      }
      showNotification(errorMsg, 'error');
    } finally {
      isAnalyzing = false;
      updateButtonToNormal();
    }
  }

  // Get settings from storage with fallback
  async function getSettings() {
    try {
      // Check if chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['language', 'backendUrl'], (result) => {
            if (chrome.runtime.lastError) {
              console.warn('[Vinscripted] Storage error:', chrome.runtime.lastError);
              resolve(DEFAULT_SETTINGS);
            } else {
              resolve({
                language: result.language || DEFAULT_SETTINGS.language,
                backendUrl: result.backendUrl || DEFAULT_SETTINGS.backendUrl
              });
            }
          });
        });
      }
    } catch (e) {
      console.warn('[Vinscripted] Could not access storage:', e);
    }
    
    // Return defaults if storage not available
    return DEFAULT_SETTINGS;
  }

  // Update button to loading state
  function updateButtonToLoading() {
    floatingButton.innerHTML = `
      <span class="vdg-spinner"></span>
      <span class="vdg-btn-text">${t('analyzing')}</span>
    `;
    floatingButton.classList.add('vdg-loading');
  }

  // Update button to normal state
  function updateButtonToNormal() {
    const photos = extractPhotoUrls();
    floatingButton.innerHTML = `
      <span class="vdg-btn-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
        </svg>
      </span>
      <span class="vdg-btn-text">${photos.length > 0 ? t('photoCount', photos.length) : t('generate')}</span>
    `;
    floatingButton.classList.remove('vdg-loading');
  }

  // Show the results modal
  function showModal(data) {
    // Remove existing modal
    if (modal) {
      modal.remove();
    }

    // Ensure data is properly formatted
    console.log('[Vinscripted] showModal called with:', data);
    
    // Extract description - handle different response formats
    let description = '';
    if (typeof data === 'string') {
      description = data;
    } else if (data && typeof data.description === 'string') {
      description = data.description;
    } else if (data && data.description) {
      description = JSON.stringify(data.description);
    } else if (data) {
      description = JSON.stringify(data);
    }

    modal = document.createElement('div');
    modal.id = 'vinted-desc-modal';
    modal.className = 'vdg-modal';
    
    // Build attributes HTML with type guard and XSS protection
    let attributesHtml = '';
    if (data && data.attributes && typeof data.attributes === 'object') {
      const attributeEntries = Object.entries(data.attributes)
        .filter(([_, value]) => value && value !== 'Non détecté');
      
      if (attributeEntries.length > 0) {
        attributesHtml = `
          <div class="vdg-section">
            <h3>Attributs détectés</h3>
            <div class="vdg-tags">
              ${attributeEntries.map(([key, value]) => {
                const safeValue = escapeHtml(typeof value === 'string' ? value : JSON.stringify(value));
                return `<span class="vdg-tag vdg-tag-${escapeHtml(key)}">${safeValue}</span>`;
              }).join('')}
            </div>
          </div>
        `;
      }
    }

    // Build keywords HTML with type guard and XSS protection
    let keywordsHtml = '';
    if (data && data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
      keywordsHtml = `
        <div class="vdg-section">
          <h3>Mots-clés SEO</h3>
          <div class="vdg-keywords">
            ${data.keywords.map(kw => `<span class="vdg-keyword">#${escapeHtml(String(kw))}</span>`).join('')}
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="vdg-modal-overlay"></div>
      <div class="vdg-modal-content">
        <div class="vdg-modal-header">
          <h2>Description générée</h2>
          <button class="vdg-close-btn" title="Fermer">x</button>
        </div>
        
        <div class="vdg-modal-body">
          <div class="vdg-section">
            <h3>Description</h3>
            <textarea id="vdg-description-text" class="vdg-description" readonly>${escapeHtml(description)}</textarea>
          </div>
          
          ${attributesHtml}
          ${keywordsHtml}
        </div>
        
        <div class="vdg-modal-footer">
          <button id="vdg-insert-btn" class="vdg-btn vdg-btn-primary">
            Inserer dans l'annonce
          </button>
          <button id="vdg-copy-btn" class="vdg-btn vdg-btn-secondary">
            Copier
          </button>
          <button id="vdg-regenerate-btn" class="vdg-btn vdg-btn-secondary">
            Regenerer
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.vdg-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.vdg-modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('#vdg-insert-btn').addEventListener('click', () => fillListing(data));
    modal.querySelector('#vdg-copy-btn').addEventListener('click', () => copyDescription(description));
    modal.querySelector('#vdg-regenerate-btn').addEventListener('click', handleGenerateClick);

    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('vdg-modal-open');
    });
  }

  // Close the modal
  function closeModal() {
    if (modal) {
      modal.classList.remove('vdg-modal-open');
      setTimeout(() => {
        modal.remove();
        modal = null;
      }, 300);
    }
  }

  // Fill the listing (Title + Description)
  function fillListing(input) {
    let description = '';
    let title = '';
    let keywords = [];

    // Handle string or object input
    if (typeof input === 'string') {
      description = input;
    } else if (typeof input === 'object' && input !== null) {
      description = input.description || '';
      title = input.title || '';
      keywords = input.keywords || [];
    }

    // --- Title Insertion ---
    if (title) {
      const titleField = findTitleField();
      if (titleField) {
        titleField.value = title;
        titleField.dispatchEvent(new Event('input', { bubbles: true }));
        titleField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[Vinscripted] Title inserted:', title);
      }
    }

    // --- Description Insertion ---
    if (!description) return;

    // Append keywords if available
    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      const keywordsString = keywords.map(kw => `#${String(kw)}`).join(' ');
      description += `\n\n${keywordsString}`;
    }

    // Try multiple selectors for the description textarea
    const descriptionField = findDescriptionField();

    if (descriptionField) {
      // Set the value
      descriptionField.value = description;
      
      // Trigger events for React/Vue to detect the change
      descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
      descriptionField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
      descriptionField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      // Focus the field
      descriptionField.focus();
      
      showNotification('Annonce remplie avec succès !', 'success');
    } else {
      // Fallback: copy to clipboard
      copyDescription(description);
      showNotification('Champ description non trouvé. Texte copié !', 'warning');
    }
  }

  // Copy description to clipboard
  async function copyDescription(description) {
    if (!description) return;
    
    try {
      await navigator.clipboard.writeText(description);
      showNotification('Description copiée dans le presse-papiers !', 'success');
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = description;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showNotification('Description copiée dans le presse-papiers !', 'success');
    }
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Skip info notifications - the button state already shows progress
    if (type === 'info') {
      return;
    }

    // Remove existing notifications
    const existing = document.querySelector('.vdg-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `vdg-notification vdg-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('vdg-notification-show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('vdg-notification-show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
})();
