"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Region = "cn" | "intl";

interface PaymentStats {
  totalAmount: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
}

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
  completedAt?: string;
}

export default function PaymentDashboard() {
  const [region, setRegion] = useState<Region>("cn");
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment/dashboard?region=${region}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [region]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">支付数据后台</h1>
        <div className="flex gap-2">
          <Button
            variant={region === "cn" ? "default" : "outline"}
            onClick={() => setRegion("cn")}
          >
            国内版
          </Button>
          <Button
            variant={region === "intl" ? "default" : "outline"}
            onClick={() => setRegion("intl")}
          >
            国外版
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总金额
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总订单数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  已完成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  待处理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  失败
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.failedCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>支付记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">交易ID</th>
                      <th className="text-left p-2">金额</th>
                      <th className="text-left p-2">状态</th>
                      <th className="text-left p-2">支付方式</th>
                      <th className="text-left p-2">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-2 font-mono text-sm">
                          {payment.transactionId}
                        </td>
                        <td className="p-2">
                          {payment.amount} {payment.currency}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-2">{payment.method}</td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          暂无数据
        </div>
      )}
    </div>
  );
}
