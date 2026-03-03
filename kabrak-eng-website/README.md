# KABRAK ENG Website

Site web officiel de KABRAK ENG présentant nos solutions logicielles professionnelles.

## 🚀 Technologies

- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Styling moderne
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start
```

## 🌐 Déploiement sur Vercel

### Option 1: Via GitHub (Recommandé)

1. Push le code sur GitHub
2. Connecte-toi sur [vercel.com](https://vercel.com)
3. Clique sur "New Project"
4. Importe ton repo GitHub
5. Vercel détecte automatiquement Next.js
6. Clique sur "Deploy"

### Option 2: Via CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Déployer en production
vercel --prod
```

## 🔧 Configuration DNS

Pour utiliser `kabrakeng.com` :

1. Va sur Vercel → Project Settings → Domains
2. Ajoute `kabrakeng.com`
3. Sur Namecheap, configure les DNS :
   - Type: `A Record`
   - Host: `@`
   - Value: `76.76.21.21` (Vercel IP)
   
   - Type: `CNAME`
   - Host: `www`
   - Value: `cname.vercel-dns.com`

## 📱 Sous-domaines

Pour `exchange.kabrakeng.com` et `optic.kabrakeng.com` :

Sur Namecheap → Advanced DNS :
- Type: `CNAME`
- Host: `exchange`
- Value: Ton URL Railway ou serveur

## 📄 Structure

```
kabrak-eng-website/
├── app/
│   ├── page.tsx          # Page d'accueil
│   ├── layout.tsx        # Layout principal
│   ├── globals.css       # Styles globaux
│   └── translations.ts   # Traductions FR/EN
├── public/               # Assets statiques
├── package.json
└── next.config.ts
```

## 🎨 Personnalisation

- **Couleurs** : Vert `#0B6E4F` et Or `#e8a020`
- **Produits** : Modifie `translations.ts`
- **Contact** : WhatsApp +237 653 561 862

## 📞 Contact

- **Email**: contact@kabrakeng.com
- **WhatsApp**: +237 653 561 862
- **Localisation**: Douala, Cameroun

---

Développé par **KABRAK ENG** 🚀
