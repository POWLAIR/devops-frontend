// URLs des services backend (côté serveur uniquement, ne pas utiliser NEXT_PUBLIC_*)
export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8000';
export const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4000';
export const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3000';
export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5000';
export const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6000';
export const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:7000';

// Timeout réseau en ms
export const REQUEST_TIMEOUT_MS = 10_000;

// Clés de stockage côté client
export const TOKEN_STORAGE_KEY = 'auth-token';
export const USER_STORAGE_KEY = 'auth-user';
export const CART_STORAGE_KEY = 'cart';

// Cookie names
export const AUTH_COOKIE = 'auth-token';
export const TENANT_COOKIE = 'x-tenant-id';

// Rôles utilisateurs
export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  MERCHANT: 'merchant',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Statuts commandes
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

// Statuts paiements
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

// Statuts notifications
export const NOTIFICATION_STATUSES = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

// Statuts tenant
export const TENANT_STATUSES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

// Messages d'erreur génériques
export const ERROR_MESSAGES = {
  NETWORK: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
  UNAUTHORIZED: 'Votre session a expiré. Veuillez vous reconnecter.',
  FORBIDDEN: "Vous n'avez pas les droits nécessaires pour cette action.",
  NOT_FOUND: "La ressource demandée n'existe pas.",
  SERVER: 'Une erreur serveur est survenue. Veuillez réessayer.',
  TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
} as const;

// Frais de livraison
export const SHIPPING_FREE_THRESHOLD = 50;
export const SHIPPING_FEE = 5;

// Commission plateforme
export const PLATFORM_COMMISSION_RATE = 0.05;

// Pagination par défaut
export const DEFAULT_PAGE_SIZE = 20;
