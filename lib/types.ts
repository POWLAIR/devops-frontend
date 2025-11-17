// Types pour l'authentification
export interface User {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ValidateResponse {
  valid: boolean;
  user?: User;
}

// Types pour les commandes
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface CreateOrderRequest {
  items: Omit<OrderItem, 'id'>[];
}

export interface UpdateOrderRequest {
  items?: Omit<OrderItem, 'id'>[];
  status?: OrderStatus;
}

