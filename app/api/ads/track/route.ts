/**
 * 广告埋点 API
 * 记录广告展示和点击事件
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, eventType } = body;

    if (!adId || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: adId, eventType" },
        { status: 400 }
      );
    }

    if (!["impression", "click"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid eventType. Must be 'impression' or 'click'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 使用 RPC 函数原子性更新广告统计
    const updateField = eventType === "impression" ? "impressions" : "clicks";

    const { error } = await supabase.rpc("increment_ad_stat", {
      p_ad_id: adId,
      p_field: updateField,
    });

    if (error) {
      console.error("[ads/track] RPC error:", error);
      return NextResponse.json(
        { error: "Failed to track ad event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ads/track] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
