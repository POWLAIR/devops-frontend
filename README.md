# Frontend / API Gateway

Application frontend et API Gateway pour DevOps MicroService App, implémentée avec Next.js 14 (App Router), TypeScript et Tailwind CSS.

## Description

Le Frontend/API Gateway est le point d'entrée unique de l'application. Il combine :

- **Interface utilisateur** : Application web React avec Next.js pour l'expérience utilisateur
- **API Gateway** : Routage et proxy des requêtes vers les microservices backend
- **Authentification** : Gestion des tokens JWT et session utilisateur
- **Multi-tenant** : Support du multi-tenancy avec isolation par tenant

## Technologies

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Fonts** : Geist (optimisé avec `next/font`)
- **Port** : 3001 (développement)

## Architecture

```
┌─────────────────────────────────────────┐
│     Frontend (Next.js) - Port 3001      │
│  ┌───────────────────────────────────┐  │
│  │      Pages & Components (React)    │  │
│  └──────────────┬────────────────────┘  │
│                 │                         │
│  ┌──────────────▼────────────────────┐  │
│  │    API Routes (API Gateway)      │  │
│  │  /api/auth/*    → Auth Service   │  │
│  │  /api/products/* → Product Service│  │
│  │  /api/orders/*   → Order Service  │  │
│  │  /api/payment/*  → Payment Service│  │
│  │  /api/tenants/*  → Tenant Service  │  │
│  │  /api/notifications/* → Notif Svc │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Prérequis

- Node.js 20+
- npm ou yarn

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env.local
# Éditer .env.local avec les valeurs appropriées
```

## Configuration

Le fichier `.env.local` doit contenir les variables suivantes :

```env
# URLs des services backend
AUTH_SERVICE_URL=http://localhost:8000
PRODUCT_SERVICE_URL=http://localhost:4000
ORDER_SERVICE_URL=http://localhost:3000
PAYMENT_SERVICE_URL=http://localhost:5000
TENANT_SERVICE_URL=http://localhost:7000
NOTIFICATION_SERVICE_URL=http://localhost:6000

# URL publique de l'API (pour le client)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Démarrage

### Développement local

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3001`

### Production

```bash
npm run build
npm run start
```

### Avec Docker Compose

```bash
docker-compose up frontend
```

## Structure du projet

```
frontend/
├── app/
│   ├── page.tsx                    # Page d'accueil
│   ├── layout.tsx                  # Layout principal
│   ├── api/                        # API Routes (API Gateway)
│   │   ├── auth/                   # Routes authentification
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── validate/route.ts
│   │   │   └── logout/route.ts
│   │   ├── products/               # Routes produits
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── validate-batch/route.ts
│   │   ├── orders/                 # Routes commandes
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── payment/                # Routes paiements
│   │   │   ├── create-intent/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── tenants/                # Routes tenants
│   │   │   └── route.ts
│   │   └── notifications/           # Routes notifications
│   │       └── sms/route.ts
│   ├── products/                    # Pages produits
│   ├── orders/                     # Pages commandes
│   ├── favorites/                  # Pages favoris
│   └── profile/                    # Pages profil
├── components/                      # Composants React
├── lib/                            # Utilitaires
│   ├── api-client.ts               # Client API
│   ├── auth.ts                     # Gestion authentification
│   └── fetch-with-timeout.ts       # Fetch avec timeout
├── .env.local                      # Variables d'environnement (non commité)
├── .env.example                    # Exemple de configuration
├── package.json                    # Dépendances Node.js
└── README.md                       # Ce fichier
```

## API Gateway - Endpoints

Le Frontend agit comme un API Gateway et expose les endpoints suivants :

### Authentification

#### POST /api/auth/login

Connexion d'un utilisateur.

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### POST /api/auth/register

Inscription d'un nouvel utilisateur.

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

#### GET /api/auth/validate

Validation d'un token JWT.

**Headers** :
```
Authorization: Bearer <token>
```

#### POST /api/auth/logout

Déconnexion d'un utilisateur.

### Produits

#### GET /api/products

Liste tous les produits (avec pagination et filtres).

**Query Parameters** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre de résultats (défaut: 20)
- `category` : Filtrer par catégorie
- `search` : Recherche par nom/description

#### GET /api/products/:id

Récupère les détails d'un produit.

#### POST /api/products/validate-batch

Valide la disponibilité d'un lot de produits (pour les commandes).

**Request Body** :
```json
{
  "products": [
    { "id": "product-1", "quantity": 2 },
    { "id": "product-2", "quantity": 1 }
  ]
}
```

#### POST /api/products/decrement-stock

Décrémente le stock après création de commande.

### Commandes

#### GET /api/orders

Liste toutes les commandes de l'utilisateur authentifié.

**Headers** :
```
Authorization: Bearer <token>
```

#### GET /api/orders/:id

Récupère les détails d'une commande.

#### POST /api/orders

Crée une nouvelle commande.

**Request Body** :
```json
{
  "items": [
    {
      "productId": "product-1",
      "quantity": 2,
      "price": 29.99
    }
  ]
}
```

#### PUT /api/orders/:id

Met à jour une commande existante.

### Paiements

#### POST /api/payment/create-intent

Crée un Payment Intent Stripe.

**Request Body** :
```json
{
  "orderId": "order-uuid",
  "amount": 5998,
  "currency": "eur"
}
```

#### GET /api/payment/:id

Récupère le statut d'un paiement.

### Tenants

#### GET /api/tenants

Liste les tenants (Platform Admin uniquement).

**Headers** :
```
Authorization: Bearer <token>
```

### Notifications

#### POST /api/notifications/sms

Envoie un SMS via le notification service.

**Request Body** :
```json
{
  "phone_number": "+33600000000",
  "message": "Votre commande a été confirmée"
}
```

## Fonctionnalités Frontend

### Pages disponibles

- **/** : Page d'accueil avec catalogue produits
- **/products** : Liste des produits avec filtres et recherche
- **/products/:id** : Détails d'un produit avec avis
- **/favorites** : Liste des favoris de l'utilisateur
- **/orders** : Liste des commandes de l'utilisateur
- **/orders/:id** : Détails d'une commande
- **/profile** : Profil utilisateur et paramètres

### Authentification

- Gestion des tokens JWT dans les cookies
- Contexte d'authentification React (`AuthContext`)
- Redirection automatique si non authentifié
- Support multi-tenant avec header `X-Tenant-ID`

### UI/UX

- Design moderne avec Tailwind CSS
- Responsive (mobile, tablette, desktop)
- Navigation avec TopBar et MainNavbar
- Footer avec liens utiles
- Gestion des erreurs avec messages utilisateur

## Développement

### Hot reload

```bash
npm run dev
```

Les modifications sont automatiquement rechargées.

### Build

```bash
npm run build
```

### Linter

```bash
npm run lint
```

## Tests

### Tests manuels

1. **Tester l'authentification** :
   - Aller sur `/profile`
   - Se connecter avec un compte test
   - Vérifier la redirection

2. **Tester les produits** :
   - Aller sur `/products`
   - Filtrer par catégorie
   - Rechercher un produit
   - Ajouter aux favoris

3. **Tester les commandes** :
   - Créer une commande depuis le panier
   - Vérifier la liste des commandes
   - Voir les détails d'une commande

## Intégration avec les services backend

### Communication

Le Frontend communique avec les services backend via les API Routes qui agissent comme proxy :

```
Client Browser → Next.js API Route → Backend Service
```

### Headers transmis

- `Authorization: Bearer <token>` : Token JWT
- `X-Tenant-ID: <tenant_id>` : ID du tenant (multi-tenant)
- `Content-Type: application/json` : Type de contenu

### Gestion des erreurs

- Timeout configuré (5 secondes par défaut)
- Retry automatique en cas d'échec
- Messages d'erreur utilisateur-friendly
- Logs côté serveur pour le debugging

## Sécurité

- **JWT** : Tokens stockés de manière sécurisée
- **CORS** : Configuré côté backend pour limiter les origines
- **Validation** : Validation des données côté client et serveur
- **HTTPS** : Recommandé en production
- **Headers sécurisés** : Configurés via Next.js

## Production

### Checklist avant déploiement

- [ ] Configurer toutes les URLs des services backend (production)
- [ ] Configurer `NEXT_PUBLIC_API_URL` avec l'URL publique
- [ ] Activer HTTPS
- [ ] Configurer les variables d'environnement sur la plateforme de déploiement
- [ ] Optimiser les images (Next.js Image)
- [ ] Activer le cache (ISR, SSG)
- [ ] Configurer les analytics (optionnel)
- [ ] Tests E2E complets

### Déploiement

#### Vercel (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

#### Docker

```bash
docker build -t frontend:latest .
docker run -p 3001:3001 --env-file .env.local frontend:latest
```

## Notes

- Le Frontend utilise Next.js App Router (Next.js 14+)
- Les API Routes sont des Server Components (pas de client-side)
- Le multi-tenant est géré via le header `X-Tenant-ID`
- Les tokens JWT sont gérés automatiquement par le contexte d'authentification

## Support

Pour toute question ou problème, consultez :
- Documentation Next.js : https://nextjs.org/docs
- Logs du service : `docker logs frontend`
- Documentation du projet : [README.md principal](../README.md)

## Licence

Projet académique EFREI - DevOps MicroService App
