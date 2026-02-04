# Vinscripted

<div align="center">
  <img src="extension/icons/icon128.png" alt="Vinscripted Logo" width="100" height="100">
  <br>
  <strong>Extension Chrome pour générer automatiquement des descriptions optimisées pour vos annonces Vinted</strong>
  <br>
  <br>
  <a href="#-description-français">Français</a> •
  <a href="#-description">English</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-utilisation">Utilisation</a> •
  <a href="#-développement">Développement</a>
</div>

---

## 🇫🇷 Description (Français)

Vinscripted est une extension Chrome qui utilise l'intelligence artificielle (Google Gemini) pour analyser vos photos d'articles et générer automatiquement des descriptions attrayantes et optimisées pour vos annonces Vinted.

### ✨ Fonctionnalités

- 🤖 **IA Générative** - Utilise Google Gemini pour analyser vos images et créer des descriptions
- 🌍 **8 Langues supportées** - Français, Anglais, Allemand, Espagnol, Italien, Néerlandais, Polonais, Portugais
- 📝 **Descriptions optimisées** - Titres accrocheurs et descriptions détaillées qui maximisent les ventes
- 🔒 **Respect de la vie privée** - Aucune donnée personnelle n'est stockée
- 🚀 **Intégration native** - S'intègre directement sur les pages d'ajout/modification d'annonces Vinted

---

## 🇬🇧 Description (English)

Vinscripted is a Chrome extension that uses artificial intelligence (Google Gemini) to analyze your item photos and automatically generate attractive, optimized descriptions for your Vinted listings.

### ✨ Features

- 🤖 **Generative AI** - Uses Google Gemini to analyze images and create descriptions
- 🌍 **8 Supported Languages** - French, English, German, Spanish, Italian, Dutch, Polish, Portuguese
- 📝 **Optimized Descriptions** - Catchy titles and detailed descriptions that maximize sales
- 🔒 **Privacy Focused** - No personal data is stored
- 🚀 **Native Integration** - Integrates directly on Vinted item add/edit pages

---

## 📦 Installation

### Extension Chrome

1. Téléchargez le fichier `extension/vinscripted_v1.0.0.zip` depuis ce repository
2. Décompressez le fichier ZIP dans un dossier
3. Ouvrez Chrome et accédez à `chrome://extensions/`
4. Activez le **Mode développeur** (coin supérieur droit)
5. Cliquez sur **"Charger l'extension non empaquetée"**
6. Sélectionnez le dossier `extension/` décompressé
7. L'extension est installée ! 🎉

### Backend (Optionnel - Pour développement)

Le backend est déjà déployé et fonctionnel. Si vous souhaitez héberger votre propre backend :

```bash
cd backend
npm install
```

Créez un fichier `.env` avec vos clés API :

```env
GEMINI_API_KEY=votre_clé_gemini
VINSCRIPTED_API_KEY=votre_clé_extension
```

Déployez sur Vercel :

```bash
npm run deploy
```

---

## 🚀 Utilisation

1. **Accédez à Vinted** - Allez sur la page d'ajout ou de modification d'un article (`/items/new` ou `/items/ID/edit`)
2. **Ajoutez vos photos** - Téléchargez les photos de votre article
3. **Cliquez sur le bouton Vinscripted** - Un bouton flottant violet apparaîtra en haut à droite
4. **Configurez** - Choisissez la langue et le style de description
5. **Générez** - Cliquez sur "Générer la description" et laissez l'IA faire le reste !
6. **Appliquez** - La description générée remplira automatiquement les champs de votre annonce

---

## 🛠️ Développement

### Structure du projet

```
vinscripted/
├── extension/                    # Extension Chrome (Manifest V3)
│   ├── manifest.json            # Configuration de l'extension
│   ├── content/                 # Content script (injecté sur Vinted)
│   │   ├── content.js
│   │   └── content.css
│   ├── popup/                   # Popup des paramètres
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── background/              # Service Worker
│   │   └── service-worker.js
│   └── icons/                   # Icônes de l'extension
│
└── backend/                      # Backend Vercel Serverless
    ├── api/
    │   └── analyze.js           # Endpoint POST /api/analyze
    ├── package.json
    └── vercel.json
```

### Technologies utilisées

- **Extension** : JavaScript vanilla, CSS, Manifest V3
- **Backend** : Node.js 18+, Vercel Serverless Functions
- **IA** : Google Gemini API (gemma-3-27b-it)

### Scripts disponibles

**Backend :**
```bash
cd backend
npm start        # Développement local (vercel dev)
npm run deploy   # Déploiement production
```

**Extension :**
- Aucune étape de build requise
- Modifiez les fichiers directement
- Rechargez l'extension dans `chrome://extensions/`

---

## 🔒 Sécurité & Confidentialité

- **Aucune donnée personnelle** n'est collectée ni stockée
- Les images sont transmises de manière sécurisée à l'API Gemini
- Les clés API sont protégées côté backend
- Politique de confidentialité disponible dans `extension/PRIVACY_POLICY.md`

---

## 🌐 Sites supportés

L'extension fonctionne sur tous les domaines Vinted :

- 🇫🇷 www.vinted.fr
- 🇧🇪 www.vinted.be
- 🇪🇸 www.vinted.es
- 🇩🇪 www.vinted.de
- 🇮🇹 www.vinted.it
- 🇳🇱 www.vinted.nl
- 🇵🇱 www.vinted.pl
- 🇵🇹 www.vinted.pt
- 🇬🇧 www.vinted.co.uk
- 🌐 www.vinted.com

---

## 📝 Licence

Ce projet est sous licence privée. Tous droits réservés.

---

## 🤝 Support

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur ce repository.

---

<div align="center">
  <strong>Fait avec ❤️ pour les vendeurs Vinted</strong>
</div>
