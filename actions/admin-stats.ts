"use server";

import { verifyAdminSession } from "@/utils/session";
import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    dau: number;
    wau: number;
    mau: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenueCny: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
  };
  orders: {
    total: number;
    paid: number;
    pending: number;
  };
  devices: {
    byDeviceType: Record<string, number>;
    byOs: Record<string, number>;
  };
}

export interface DailyStats {
  date: string;
  activeUsers: number;
  newUsers: number;
  builds: number;
}

export interface RevenueStats {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(
  source: "all" | "global" | "cn" = "all"
): Promise<DashboardStats> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user stats
    const { data: users } = await supabase
      .from("users")
      .select("id, created_at, last_active_at");

    const totalUsers = users?.length || 0;
    const todayUsers = users?.filter(u => new Date(u.created_at) >= today).length || 0;
    const weekUsers = users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0;
    const monthUsers = users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0;

    const dau = users?.filter(u => u.last_active_at && new Date(u.last_active_at) >= today).length || 0;
    const wau = users?.filter(u => u.last_active_at && new Date(u.last_active_at) >= weekAgo).length || 0;
    const mau = users?.filter(u => u.last_active_at && new Date(u.last_active_at) >= monthAgo).length || 0;

    // Get payment stats
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, currency, status, created_at");

    const totalPayments = payments?.length || 0;
    const completedPayments = payments?.filter(p => p.status === "completed").length || 0;
    const pendingPayments = payments?.filter(p => p.status === "pending").length || 0;

    // Calculate revenue
    const totalRevenue = payments?.filter(p => p.status === "completed" && p.currency === "USD")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const todayRevenue = payments?.filter(p => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= today)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const weekRevenue = payments?.filter(p => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= weekAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const monthRevenue = payments?.filter(p => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= monthAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const totalRevenueCny = payments?.filter(p => p.status === "completed" && p.currency === "CNY")
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const todayRevenueCny = payments?.filter(p => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= today)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const weekRevenueCny = payments?.filter(p => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= weekAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const monthRevenueCny = payments?.filter(p => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= monthAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Get subscription stats
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id, plan");

    const totalSubscriptions = subscriptions?.length || 0;
    const byPlan: Record<string, number> = {};
    subscriptions?.forEach(s => {
      byPlan[s.plan] = (byPlan[s.plan] || 0) + 1;
    });

    return {
      users: {
        total: totalUsers,
        today: todayUsers,
        thisWeek: weekUsers,
        thisMonth: monthUsers,
        dau,
        wau,
        mau,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
      },
      revenueCny: {
        total: totalRevenueCny,
        today: todayRevenueCny,
        thisWeek: weekRevenueCny,
        thisMonth: monthRevenueCny,
      },
      subscriptions: {
        total: totalSubscriptions,
        byPlan,
      },
      orders: {
        total: totalPayments,
        paid: completedPayments,
        pending: pendingPayments,
      },
      devices: {
        byDeviceType: {},
        byOs: {},
      },
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    throw error;
  }
}

/**
 * Get daily active users data
 */
export async function getDailyActiveUsers(
  source: "all" | "global" | "cn" = "all",
  days: number = 30
): Promise<DailyStats[]> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: users } = await supabase
      .from("users")
      .select("created_at, last_active_at")
      .gte("created_at", startDate.toISOString());

    // Group by date
    const statsByDate: Record<string, DailyStats> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      statsByDate[dateStr] = {
        date: dateStr,
        activeUsers: 0,
        newUsers: 0,
        builds: 0,
      };
    }

    users?.forEach(user => {
      const createdDate = new Date(user.created_at).toISOString().split("T")[0];
      if (statsByDate[createdDate]) {
        statsByDate[createdDate].newUsers++;
      }

      if (user.last_active_at) {
        const activeDate = new Date(user.last_active_at).toISOString().split("T")[0];
        if (statsByDate[activeDate]) {
          statsByDate[activeDate].activeUsers++;
        }
      }
    });

    return Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Get daily active users error:", error);
    throw error;
  }
}

/**
 * Get daily revenue data
 */
export async function getDailyRevenue(
  source: "all" | "global" | "cn" = "all",
  days: number = 30
): Promise<RevenueStats[]> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, currency, status, created_at")
      .gte("created_at", startDate.toISOString())
      .eq("status", "completed");

    // Group by date
    const statsByDate: Record<string, RevenueStats> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      statsByDate[dateStr] = {
        date: dateStr,
        revenue: 0,
        orders: 0,
      };
    }

    payments?.forEach(payment => {
      const paymentDate = new Date(payment.created_at).toISOString().split("T")[0];
      if (statsByDate[paymentDate]) {
        statsByDate[paymentDate].revenue += payment.amount || 0;
        statsByDate[paymentDate].orders++;
      }
    });

    return Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Get daily revenue error:", error);
    throw error;
  }
}
