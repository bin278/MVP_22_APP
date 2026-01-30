"use server";

import { verifyAdminSession } from "@/utils/session";
import { createClient } from "@/lib/supabase/server";

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  payment_type: string;
  plan_type?: string;
  billing_cycle?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all payments
 */
export async function getPayments(status?: string, limit: number = 100) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as Payment[];
  } catch (error) {
    console.error("Get payments error:", error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(id: string, status: string) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Update payment status error:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}
