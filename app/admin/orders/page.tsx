"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPayments, updatePaymentStatus, type Payment } from "@/actions/admin-orders";

export default function AdminOrdersPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadPayments();
  }, [filter]);

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await getPayments(filter);
      setPayments(data);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    const result = await updatePaymentStatus(id, status);
    if (result.success) {
      loadPayments();
    } else {
      alert(result.error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">支付管理</h1>
        <div className="flex gap-2">
          <Button
            variant={!filter ? "default" : "outline"}
            onClick={() => setFilter(undefined)}
          >
            全部
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
          >
            已完成
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            待处理
          </Button>
          <Button
            variant={filter === "failed" ? "default" : "outline"}
            onClick={() => setFilter("failed")}
          >
            失败
          </Button>
        </div>
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
                  <th className="text-left p-2">支付ID</th>
                  <th className="text-left p-2">金额</th>
                  <th className="text-left p-2">类型</th>
                  <th className="text-left p-2">状态</th>
                  <th className="text-left p-2">支付方式</th>
                  <th className="text-left p-2">交易ID</th>
                  <th className="text-left p-2">创建时间</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2 font-mono text-sm">{payment.id.slice(0, 8)}</td>
                    <td className="p-2">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="p-2 text-sm">
                      {payment.payment_type === "subscription" ? "订阅" : "积分包"}
                      {payment.plan_type && ` (${payment.plan_type})`}
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          payment.status === "completed"
                            ? "default"
                            : payment.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="p-2">{payment.payment_method}</td>
                    <td className="p-2 font-mono text-sm">
                      {payment.transaction_id?.slice(0, 12) || "-"}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString()}
                    </td>
                    <td className="p-2">
                      {payment.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(payment.id, "completed")}
                        >
                          标记完成
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">暂无支付记录</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
