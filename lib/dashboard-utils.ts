import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  platformCommission: number;
  netRevenue: number;
}

export interface SalesDataPoint {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

/**
 * Calcule les statistiques du dashboard
 */
export function calculateStats(
  orders: Order[],
  products: Product[],
  payments: Payment[],
  commissionRate: number = 0.05
): DashboardStats {
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);

  const totalOrders = orders.filter((o) => o.status !== 'cancelled').length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const platformCommission = totalRevenue * commissionRate;
  const netRevenue = totalRevenue - platformCommission;

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalProducts: products.length,
    platformCommission,
    netRevenue,
  };
}

/**
 * Génère les données de ventes mensuelles pour les 6 derniers mois
 */
export function generateSalesData(orders: Order[]): SalesDataPoint[] {
  const now = new Date();
  const months: SalesDataPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return (
        orderDate >= monthStart &&
        orderDate <= monthEnd &&
        order.status !== 'cancelled'
      );
    });

    const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0);

    months.push({
      month: format(monthDate, 'MMM', { locale: fr }),
      revenue,
      orders: monthOrders.length,
    });
  }

  return months;
}

/**
 * Récupère les 5 produits les plus vendus
 */
export function getTopProducts(
  orders: Order[],
  products: Product[]
): TopProduct[] {
  const productStats = new Map<
    string,
    { quantity: number; revenue: number }
  >();

  // Agréger les statistiques par produit
  orders
    .filter((o) => o.status !== 'cancelled')
    .forEach((order) => {
      order.items.forEach((item) => {
        const current = productStats.get(item.productId) || {
          quantity: 0,
          revenue: 0,
        };
        productStats.set(item.productId, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.price * item.quantity,
        });
      });
    });

  // Convertir en tableau et trier par quantité
  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => {
      const product = products.find((p) => p.id === productId);
      return {
        id: productId,
        name: product?.name || 'Produit inconnu',
        quantity: stats.quantity,
        revenue: stats.revenue,
      };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return topProducts;
}

/**
 * Formate un montant en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

