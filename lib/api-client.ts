import { getToken, removeToken } from './auth';
import type { AuthResponse, LoginRequest, RegisterRequest, ValidateResponse, Order, CreateOrderRequest, UpdateOrderRequest } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Effectue une requête HTTP avec gestion automatique du token
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Si le token est invalide, le supprimer
        if (response.status === 401) {
          removeToken();
        }

        throw new ApiError(
          data.message || 'Une erreur est survenue',
          response.status,
          data.code
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Erreur de connexion au serveur',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // Méthodes pour l'authentification
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateToken(): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('/api/auth/validate');
  }

  async logout(): Promise<void> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Méthodes pour les commandes
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    return this.request<void>(`/api/orders/${id}`, {
      method: 'DELETE',
    });
  }
}

// Instance singleton du client API
export const apiClient = new ApiClient();

