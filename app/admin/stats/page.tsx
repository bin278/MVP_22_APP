"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getDashboardStats,
  getDailyActiveUsers,
  getDailyRevenue,
  type DashboardStats,
  type DailyStats,
  type RevenueStats,
} from "@/actions/admin-stats";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function AdminStatsPage() {
  const [source, setSource] = useState<"all" | "global" | "cn">("all");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyUsers, setDailyUsers] = useState<DailyStats[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [source]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, usersData, revenueData] = await Promise.all([
        getDashboardStats(source),
        getDailyActiveUsers(source, 30),
        getDailyRevenue(source, 30),
      ]);

      setStats(statsData);
      setDailyUsers(usersData);
      setDailyRevenue(revenueData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">加载失败</div>
      </div>
    );
  }

  const subscriptionData = Object.entries(stats.subscriptions.byPlan).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">数据统计</h1>
        <div className="flex gap-2">
          <Button
            variant={source === "all" ? "default" : "outline"}
            onClick={() => setSource("all")}
          >
            全部
          </Button>
          <Button
            variant={source === "global" ? "default" : "outline"}
            onClick={() => setSource("global")}
          >
            国际版
          </Button>
          <Button
            variant={source === "cn" ? "default" : "outline"}
            onClick={() => setSource("cn")}
          >
            国内版
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">用户统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总用户数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今日新增
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.today}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本周新增
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.thisWeek}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月新增
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.thisMonth}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Users */}
      <div>
        <h2 className="text-xl font-semibold mb-4">活跃用户</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                日活 (DAU)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.dau}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                周活 (WAU)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.wau}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                月活 (MAU)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.mau}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">收入统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>美元收入</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总收入:</span>
                <span className="font-bold">${stats.revenue.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">今日:</span>
                <span>${stats.revenue.today.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本周:</span>
                <span>${stats.revenue.thisWeek.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本月:</span>
                <span>${stats.revenue.thisMonth.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>人民币收入</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总收入:</span>
                <span className="font-bold">¥{stats.revenueCny.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">今日:</span>
                <span>¥{stats.revenueCny.today.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本周:</span>
                <span>¥{stats.revenueCny.thisWeek.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本月:</span>
                <span>¥{stats.revenueCny.thisMonth.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Orders & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>订单统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">总订单:</span>
              <span className="font-bold">{stats.orders.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">已支付:</span>
              <span className="text-green-600">{stats.orders.paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">待处理:</span>
              <span className="text-yellow-600">{stats.orders.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>订阅统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">
              {stats.subscriptions.total} 个订阅
            </div>
            {subscriptionData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>用户趋势 (30天)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#8884d8"
                name="活跃用户"
              />
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#82ca9d"
                name="新增用户"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>收入趋势 (30天)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="收入" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
