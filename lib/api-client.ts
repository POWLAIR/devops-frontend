import { getToken, removeToken } from "./auth";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ValidateResponse,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  Tenant,
  User,
  UserUpdateRequest,
  PasswordUpdateRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
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
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Ajouter le tenant_id depuis le localStorage si disponible
    if (typeof window !== 'undefined') {
      try {
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          headers["X-Tenant-ID"] = tenantId;
        }
      } catch {
        // ignore
      }
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
          data.message || "Une erreur est survenue",
          response.status,
          data.code
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Erreur de connexion au serveur", 0, "NETWORK_ERROR");
    }
  }

  // Méthodes pour l'authentification
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async validateToken(): Promise<ValidateResponse> {
    return this.request<ValidateResponse>("/api/auth/validate");
  }

  async logout(): Promise<void> {
    return this.request<void>("/api/auth/logout", {
      method: "POST",
    });
  }

  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>("/api/tenants");
  }

  // Méthodes pour les commandes
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>("/api/orders");
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    return this.request<void>(`/api/orders/${id}`, {
      method: "DELETE",
    });
  }

  // Méthodes pour le profil utilisateur
  async getProfile(): Promise<User> {
    return this.request<User>("/api/users/me");
  }

  async updateProfile(data: UserUpdateRequest): Promise<User> {
    return this.request<User>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: PasswordUpdateRequest): Promise<void> {
    return this.request<void>("/api/users/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Méthodes pour les produits
  async getProducts(params?: {
    category?: string;
    search?: string;
    popular?: boolean;
    recent?: boolean;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.popular) queryParams.append('popular', 'true');
    if (params?.recent) queryParams.append('recent', 'true');
    
    const query = queryParams.toString();
    return this.request<any[]>(`/api/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<any> {
    return this.request<any>(`/api/products/${id}`);
  }

  async getCategories(): Promise<string[]> {
    return this.request<string[]>("/api/categories");
  }

  // Méthodes pour les favoris
  async getFavorites(): Promise<any[]> {
    return this.request<any[]>("/api/favorites");
  }

  async addFavorite(productId: string): Promise<void> {
    return this.request<void>("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  }

  async removeFavorite(productId: string): Promise<void> {
    return this.request<void>(`/api/favorites/${productId}`, {
      method: "DELETE",
    });
  }

  async isFavorite(productId: string): Promise<boolean> {
    return this.request<{ isFavorite: boolean }>(`/api/products/${productId}/is-favorite`)
      .then(res => res.isFavorite);
  }

  // Méthodes pour les paiements
  async getPayments(): Promise<any[]> {
    return this.request<any[]>("/api/payments");
  }

  // Méthodes pour les notifications
  async getNotifications(params?: {
    type?: string;
    status?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return this.request<any[]>(`/api/notifications/history${query ? `?${query}` : ''}`);
  }

  async getUnreadNotificationCount(): Promise<number> {
    return this.request<{ count: number }>("/api/notifications/unread-count")
      .then(res => res.count);
  }

  // Méthodes pour l'équipe (Owner uniquement)
  async getTeamUsers(): Promise<User[]> {
    return this.request<User[]>("/api/team/users");
  }

  async inviteTeamMember(data: {
    email: string;
    full_name: string;
    role: string;
  }): Promise<void> {
    return this.request<void>("/api/team/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTeamUserStatus(userId: string, isActive: boolean): Promise<void> {
    return this.request<void>(`/api/team/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async updateTeamUserRole(userId: string, role: string): Promise<void> {
    return this.request<void>(`/api/team/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }
}

// Instance singleton du client API
export const apiClient = new ApiClient();
