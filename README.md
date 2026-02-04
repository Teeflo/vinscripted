# Vinscripted

Extension Chrome qui analyse automatiquement les photos d'une annonce Vinted et génère une description optimisée grâce à l'IA (Google Gemini Vision).

## 🚀 Fonctionnalités

- **Analyse automatique des images** : Détecte les caractéristiques de vos articles (catégorie, état, couleur, taille, marque, matière)
- **Descriptions optimisées** : Génère des descriptions concises et engageantes pour maximiser vos ventes
- **Multi-langues** : Supporte 8 langues (FR, EN, DE, ES, IT, NL, PL, PT)
- **Intégration fluide** : Bouton flottant sur la page de création d'annonce Vinted
- **Insertion automatique** : Insère la description directement dans le champ Vinted

## 📁 Structure du projet

```
VintedDescription/
├── extension/          # Extension Chrome
│   ├── manifest.json   # Configuration Manifest V3
│   ├── popup/          # Interface des paramètres
│   ├── content/        # Script injecté sur Vinted
│   ├── background/     # Service Worker
│   └── icons/          # Icônes de l'extension
└── backend/            # Backend Vercel
    ├── api/
    │   └── analyze.js  # Endpoint d'analyse
    ├── vercel.json     # Configuration Vercel
    └── package.json    # Dépendances
```

## 🛠️ Prérequis

1. **Clé API Google Gemini**
   - Rendez-vous sur [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Créez un projet Google Cloud si nécessaire
   - Générez une clé API gratuite

2. **Compte Vercel**
   - Inscrivez-vous sur [vercel.com](https://vercel.com/signup)
   - Installez Vercel CLI : `npm i -g vercel`

3. **Chrome installé** pour tester l'extension

## 📦 Installation

### 1. Backend Vercel

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditez .env et ajoutez votre GEMINI_API_KEY

# Déployer sur Vercel
vercel login
vercel

# Définir la variable d'environnement sur Vercel
vercel env add GEMINI_API_KEY

# Déployer en production
vercel --prod
```

Notez l'URL de votre backend (ex: `https://votre-backend.vercel.app`)

### 2. Extension Chrome

```bash
# Créer les icônes (placez des PNG 16x16, 32x32, 48x48, 128x128 dans extension/icons/)
# Vous pouvez générer des icônes simples sur https://www.flaticon.com/

# Ouvrir Chrome et charger l'extension :
# 1. Ouvrir chrome://extensions/
# 2. Activer "Mode développeur" (toggle en haut à droite)
# 3. Cliquer sur "Charger l'extension non empaquetée"
# 4. Sélectionner le dossier 'extension/'
```

### 3. Configuration de l'Extension

1. Cliquez sur l'icône de l'extension dans Chrome
2. Configurez :
   - **Langue** : Choisissez la langue des descriptions
   - **URL du backend** : Collez l'URL de votre backend Vercel
3. Cliquez sur "Sauvegarder"

## 🎯 Utilisation

1. **Allez sur Vinted** et créez une nouvelle annonce
2. **Ajoutez vos photos** de l'article
3. **Cliquez sur le bouton flottant** "✨ Générer la description"
4. **Attendez l'analyse** (2-5 secondes)
5. **Reviewez les résultats** :
   - Description générée
   - Attributs détectés (catégorie, état, etc.)
   - Mots-clés SEO suggérés
6. **Cliquez sur "Insérer"** pour ajouter automatiquement la description

## 🌍 Langues supportées

| Code | Langue |
|------|--------|
| `fr` | Français |
| `en` | English |
| `de` | Deutsch |
| `es` | Español |
| `it` | Italiano |
| `nl` | Nederlands |
| `pl` | Polski |
| `pt` | Português |

## ⚙️ Configuration avancée

### Variables d'environnement Backend

```env
GEMINI_API_KEY=votre_clé_api_gemini
```

### Limiter les origines CORS (production)

Modifiez `backend/api/analyze.js` :

```javascript
const ALLOWED_ORIGINS = [
  'https://www.vinted.fr',
  'https://www.vinted.be',
  // ... autres domaines
];
```

## 🔒 Sécurité

- Aucune image n'est stockée sur le serveur
- Les images sont traitées en mémoire uniquement
- Clé API stockée côté serveur uniquement
- Rate limiting : 10 requêtes/minute par IP
- Pas de tracking utilisateur

## 🐛 Dépannage

### L'extension ne s'affiche pas sur Vinted
- Vérifiez que vous êtes sur une URL `/items/new` ou `/member/items/new`
- Rafraîchissez la page

### "Erreur de connexion"
- Vérifiez l'URL du backend dans les paramètres de l'extension
- Assurez-vous que le backend Vercel est bien déployé

### "Service temporairement indisponible"
- L'API Gemini peut être surchargée, réessayez dans quelques instants
- Vérifiez votre quota d'utilisation sur Google Cloud Console

## 📝 Prompt Gemini utilisé

Le backend envoie ce prompt optimisé à Gemini Vision :

```
Tu es un expert en vente sur Vinted. Analyse les images fournies et génère 
une description d'annonce parfaite.

RÈGLES :
1. Sois concis mais descriptif (150-300 caractères)
2. Mentionne l'état réel de l'article
3. Décris les caractéristiques visibles
4. Mentionne honnêtement les défauts éventuels
5. Utilise un ton chaleureux et vendeur
6. N'invente pas de marque si elle n'est pas visible

FORMAT JSON :
{
  "description": "...",
  "attributes": {
    "category": "...",
    "condition": "...",
    "color": "...",
    "size": "...",
    "brand": "...",
    "material": "..."
  },
  "keywords": ["..."]
}
```

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 🙏 Crédits

- [Google Gemini API](https://ai.google.dev/)
- [Vercel](https://vercel.com/)
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/)

---

**Note** : Cette extension n'est pas affiliée à Vinted. Utilisez-la conformément aux Conditions d'Utilisation de Vinted.
