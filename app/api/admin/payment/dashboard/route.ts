/**
 * 支付数据后台 API - 统一查询国内和国外支付记录
 * GET /api/payment/dashboard?region=cn|intl&startDate=xxx&endDate=xxx
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";
import { getSupabaseAdmin } from "@/lib/database/supabase";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region") || "cn";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!["cn", "intl"].includes(region)) {
      return NextResponse.json(
        { success: false, error: "无效的区域参数" },
        { status: 400 }
      );
    }

    let payments: any[] = [];
    let stats = {
      totalAmount: 0,
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
    };

    if (region === "cn") {
      const db = getCloudBaseDatabase();
      const collection = db.collection(CloudBaseCollections.PAYMENTS);

      let query: any = {};
      if (startDate || endDate) {
        query.created_at = {};
        if (startDate) query.created_at.$gte = startDate;
        if (endDate) query.created_at.$lte = endDate;
      }

      const result = await collection.where(query).get();
      payments = result.data || [];

      payments.forEach((p: any) => {
        stats.totalCount++;
        // Handle legacy data without status field (assume completed)
        const status = p.status || "completed";
        if (status === "completed") {
          stats.completedCount++;
          stats.totalAmount += p.amount || 0;
        } else if (status === "pending") {
          stats.pendingCount++;
        } else if (status === "failed") {
          stats.failedCount++;
        }
      });
    } else {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: "Supabase 配置不可用" },
          { status: 500 }
        );
      }
      let query = supabase.from("payments").select("*");

      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);

      const { data, error } = await query;
      if (error) throw error;

      payments = data || [];

      payments.forEach((p: any) => {
        stats.totalCount++;
        if (p.status === "completed") {
          stats.completedCount++;
          stats.totalAmount += p.amount || 0;
        } else if (p.status === "pending") {
          stats.pendingCount++;
        } else if (p.status === "failed") {
          stats.failedCount++;
        }
      });
    }

    return NextResponse.json({
      success: true,
      region,
      stats,
      payments: payments.map((p: any) => ({
        id: p._id || p.id,
        transactionId: p.transaction_id || p._id || p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status || "completed",
        method: p.payment_method || p.metadata?.planType || "unknown",
        createdAt: p.created_at,
        completedAt: p.completed_at || p.created_at,
      })),
    });
  } catch (error: any) {
    console.error("[Payment Dashboard] 查询失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "查询失败" },
      { status: 500 }
    );
  }
}
