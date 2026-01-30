"use server";

import { verifyAdminSession } from "@/utils/session";
import { getDatabaseProvider } from "@/lib/database";
import { getSupabaseAdmin } from "@/lib/database/supabase";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";

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
 * Get dashboard statistics from the configured database
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      return await getSupabaseStats(today, weekAgo, monthAgo);
    } else {
      return await getCloudBaseStats(today, weekAgo, monthAgo);
    }
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    throw error;
  }
}

async function getSupabaseStats(today: Date, weekAgo: Date, monthAgo: Date): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return getEmptyStats();
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, created_at, last_active_at");

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, currency, status, created_at");

  const { data: subscriptions } = await supabase
    .from("user_subscriptions")
    .select("id, plan_type");

  return calculateStats(users || [], payments || [], subscriptions || [], today, weekAgo, monthAgo);
}

async function getCloudBaseStats(today: Date, weekAgo: Date, monthAgo: Date): Promise<DashboardStats> {
  try {
    const db = getCloudBaseDatabase();

    const usersResult = await db.collection(CloudBaseCollections.USERS).get();
    const paymentsResult = await db.collection(CloudBaseCollections.PAYMENTS).get();
    const subscriptionsResult = await db.collection(CloudBaseCollections.SUBSCRIPTIONS).get();

    return calculateStats(
      usersResult.data || [],
      paymentsResult.data || [],
      subscriptionsResult.data || [],
      today,
      weekAgo,
      monthAgo
    );
  } catch (error) {
    console.error("CloudBase stats error:", error);
    return getEmptyStats();
  }
}

function calculateStats(
  users: any[],
  payments: any[],
  subscriptions: any[],
  today: Date,
  weekAgo: Date,
  monthAgo: Date
): DashboardStats {
  const totalUsers = users.length;
  const todayUsers = users.filter((u: any) => new Date(u.created_at) >= today).length;
  const weekUsers = users.filter((u: any) => new Date(u.created_at) >= weekAgo).length;
  const monthUsers = users.filter((u: any) => new Date(u.created_at) >= monthAgo).length;

  const dau = users.filter((u: any) => u.last_active_at && new Date(u.last_active_at) >= today).length;
  const wau = users.filter((u: any) => u.last_active_at && new Date(u.last_active_at) >= weekAgo).length;
  const mau = users.filter((u: any) => u.last_active_at && new Date(u.last_active_at) >= monthAgo).length;

  const totalPayments = payments.length;
  const completedPayments = payments.filter((p: any) => p.status === "completed").length;
  const pendingPayments = payments.filter((p: any) => p.status === "pending").length;

  const totalRevenue = payments
    .filter((p: any) => p.status === "completed" && p.currency === "USD")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const todayRevenue = payments
    .filter((p: any) => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= today)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const weekRevenue = payments
    .filter((p: any) => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= weekAgo)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const monthRevenue = payments
    .filter((p: any) => p.status === "completed" && p.currency === "USD" && new Date(p.created_at) >= monthAgo)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const totalRevenueCny = payments
    .filter((p: any) => p.status === "completed" && p.currency === "CNY")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const todayRevenueCny = payments
    .filter((p: any) => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= today)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const weekRevenueCny = payments
    .filter((p: any) => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= weekAgo)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const monthRevenueCny = payments
    .filter((p: any) => p.status === "completed" && p.currency === "CNY" && new Date(p.created_at) >= monthAgo)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const totalSubscriptions = subscriptions.length;
  const byPlan: Record<string, number> = {};
  subscriptions.forEach((s: any) => {
    const plan = s.plan_type || s.plan; // Support both field names
    if (plan) {
      byPlan[plan] = (byPlan[plan] || 0) + 1;
    }
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
}

function getEmptyStats(): DashboardStats {
  return {
    users: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, dau: 0, wau: 0, mau: 0 },
    revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    revenueCny: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    subscriptions: { total: 0, byPlan: {} },
    orders: { total: 0, paid: 0, pending: 0 },
    devices: { byDeviceType: {}, byOs: {} },
  };
}

/**
 * Get daily active users data
 */
export async function getDailyActiveUsers(days: number = 30): Promise<DailyStats[]> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      return await getSupabaseDailyUsers(startDate, days);
    } else {
      return await getCloudBaseDailyUsers(startDate, days);
    }
  } catch (error) {
    console.error("Get daily active users error:", error);
    throw error;
  }
}

async function getSupabaseDailyUsers(startDate: Date, days: number): Promise<DailyStats[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data: users } = await supabase
    .from("users")
    .select("created_at, last_active_at")
    .gte("created_at", startDate.toISOString());

  return groupUsersByDate(users || [], days);
}

async function getCloudBaseDailyUsers(startDate: Date, days: number): Promise<DailyStats[]> {
  try {
    const db = getCloudBaseDatabase();
    const result = await db
      .collection(CloudBaseCollections.USERS)
      .where({
        created_at: db.command.gte(startDate.toISOString()),
      })
      .get();

    return groupUsersByDate(result.data || [], days);
  } catch (error) {
    console.error("CloudBase daily users error:", error);
    return [];
  }
}

function groupUsersByDate(users: any[], days: number): DailyStats[] {
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

  users.forEach((user: any) => {
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
}

/**
 * Get daily revenue data
 */
export async function getDailyRevenue(days: number = 30): Promise<RevenueStats[]> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      return await getSupabaseDailyRevenue(startDate, days);
    } else {
      return await getCloudBaseDailyRevenue(startDate, days);
    }
  } catch (error) {
    console.error("Get daily revenue error:", error);
    throw error;
  }
}

async function getSupabaseDailyRevenue(startDate: Date, days: number): Promise<RevenueStats[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, currency, status, created_at")
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed");

  return groupPaymentsByDate(payments || [], days);
}

async function getCloudBaseDailyRevenue(startDate: Date, days: number): Promise<RevenueStats[]> {
  try {
    const db = getCloudBaseDatabase();
    const result = await db
      .collection(CloudBaseCollections.PAYMENTS)
      .where({
        created_at: db.command.gte(startDate.toISOString()),
        status: "completed",
      })
      .get();

    return groupPaymentsByDate(result.data || [], days);
  } catch (error) {
    console.error("CloudBase daily revenue error:", error);
    return [];
  }
}

function groupPaymentsByDate(payments: any[], days: number): RevenueStats[] {
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

  payments.forEach((payment: any) => {
    const paymentDate = new Date(payment.created_at).toISOString().split("T")[0];
    if (statsByDate[paymentDate]) {
      statsByDate[paymentDate].revenue += payment.amount || 0;
      statsByDate[paymentDate].orders++;
    }
  });

  return Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date));
}
