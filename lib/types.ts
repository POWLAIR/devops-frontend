import type { OrderStatus, PaymentStatus, UserRole } from './constants';

// ─── Erreurs API ────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  detail?: string;
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name?: string;
  tenant_id: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

// Réponse du tenant-service (TypeORM/NestJS — camelCase)
export interface Tenant {
  id: string;
  name?: string;
  contactEmail?: string;
  subdomain?: string;
  description?: string;
  customDomain?: string;
  status?: string;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  subscriptions?: TenantSubscription[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscription {
  id?: string;
  status?: string;
  plan?: Plan;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ValidateResponse {
  valid: boolean;
  user?: User;
}

export interface UserUpdateRequest {
  full_name?: string;
  email?: string;
}

export interface PasswordUpdateRequest {
  current_password: string;
  new_password: string;
}

// ─── Product Service ─────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  category_id?: string;
  image_url?: string;
  tenant_id?: string;
  is_active?: boolean;
  average_rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id?: string;
  image_url?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface StockUpdateRequest {
  stock: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  author?: string;
  created_at?: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface ProductValidateBatchRequest {
  items: Array<{ product_id: string; quantity: number }>;
}

export interface ProductValidateBatchResponse {
  valid: boolean;
  items: Array<{
    product_id: string;
    available: boolean;
    stock: number;
    requested: number;
  }>;
}

export interface DecrementStockRequest {
  items: Array<{ product_id: string; quantity: number }>;
}

// ─── Order Service ────────────────────────────────────────────────────────────

export interface OrderItem {
  id?: string;
  product_id: string;
  name?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id?: string;
  tenant_id?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_id?: string;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

export interface CreateOrderRequest {
  items: Array<{ product_id: string; quantity: number; price: number }>;
  status?: OrderStatus;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  items?: Array<{ product_id: string; quantity: number; price: number }>;
}

// ─── Payment Service ──────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  order_id: string;
  tenant_id?: string;
  user_id?: string;
  amount: number;
  commission?: number;
  net_amount?: number;
  currency?: string;
  status: PaymentStatus;
  provider?: string;
  client_secret?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  order_id: string;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_id: string;
  amount: number;
  status: string;
  simulation?: boolean;
}

// ─── Notification Service ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  status: string;
  tenant_id?: string;
  user_id?: string;
  template?: string;
  sent_at?: string;
  created_at?: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  unread_count?: number;
}

// ─── Tenant Service ───────────────────────────────────────────────────────────

// Réponse du tenant-service — champs en camelCase
export interface Plan {
  id: string;      // 'free' | 'starter' | 'pro' | 'enterprise'
  name: string;
  monthlyPrice: number;
  productLimit: number;
  orderLimit: number;
}

// Réponse réelle du tenant-service : { tenantId, currentStep, completed }
export interface OnboardingProgress {
  tenantId: string;
  currentStep: number;
  completed: boolean;
}

export interface CompleteStepRequest {
  step: number;
}

// ─── Cart (état local) ────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}
