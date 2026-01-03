"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export function BillingHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          账单历史
        </CardTitle>
        <CardDescription>
          查看您的支付记录和账单详情
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无账单记录</p>
          <p className="text-sm mt-2">完成支付后，账单记录将显示在这里</p>
        </div>
      </CardContent>
    </Card>
  );
}




