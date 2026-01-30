"use server";

import { verifyAdminSession } from "@/utils/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Ad {
  id: string;
  title: string;
  description?: string;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url?: string;
  link_url?: string;
  link_type: "external" | "internal" | "download";
  position: "left" | "right" | "top" | "bottom";
  platform: string;
  region: "global" | "cn" | "all";
  status: "active" | "inactive" | "scheduled";
  priority: number;
  start_at?: string;
  end_at?: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all ads
 */
export async function getAds(
  region?: "global" | "cn" | "all",
  status?: "active" | "inactive" | "scheduled"
) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("ads").select("*").order("priority", { ascending: false });

    if (region && region !== "all") {
      query = query.or(`region.eq.${region},region.eq.all`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as Ad[];
  } catch (error) {
    console.error("Get ads error:", error);
    throw error;
  }
}

/**
 * Get single ad
 */
export async function getAd(id: string) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data as Ad;
  } catch (error) {
    console.error("Get ad error:", error);
    throw error;
  }
}

/**
 * Create ad
 */
export async function createAd(formData: FormData) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const startAt = formData.get("start_at") as string;
    const endAt = formData.get("end_at") as string;

    const adData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      media_type: formData.get("media_type") as "image" | "video",
      media_url: formData.get("media_url") as string,
      thumbnail_url: formData.get("thumbnail_url") as string,
      link_url: formData.get("link_url") as string,
      link_type: formData.get("link_type") as "external" | "internal" | "download",
      position: formData.get("position") as "left" | "right" | "top" | "bottom",
      platform: formData.get("platform") as string,
      region: formData.get("region") as "global" | "cn" | "all",
      status: formData.get("status") as "active" | "inactive" | "scheduled",
      priority: parseInt(formData.get("priority") as string) || 0,
      start_at: startAt || null,
      end_at: endAt || null,
      impressions: 0,
      clicks: 0,
    };

    const { data, error } = await supabase
      .from("ads")
      .insert(adData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/ads");
    return { success: true, data };
  } catch (error) {
    console.error("Create ad error:", error);
    return { success: false, error: "Failed to create ad" };
  }
}

/**
 * Update ad
 */
export async function updateAd(id: string, formData: FormData) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const startAt = formData.get("start_at") as string;
    const endAt = formData.get("end_at") as string;

    const adData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      media_type: formData.get("media_type") as "image" | "video",
      media_url: formData.get("media_url") as string,
      thumbnail_url: formData.get("thumbnail_url") as string,
      link_url: formData.get("link_url") as string,
      link_type: formData.get("link_type") as "external" | "internal" | "download",
      position: formData.get("position") as "left" | "right" | "top" | "bottom",
      platform: formData.get("platform") as string,
      region: formData.get("region") as "global" | "cn" | "all",
      status: formData.get("status") as "active" | "inactive" | "scheduled",
      priority: parseInt(formData.get("priority") as string) || 0,
      start_at: startAt || null,
      end_at: endAt || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("ads")
      .update(adData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/ads");
    return { success: true, data };
  } catch (error) {
    console.error("Update ad error:", error);
    return { success: false, error: "Failed to update ad" };
  }
}

/**
 * Delete ad
 */
export async function deleteAd(id: string) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("ads").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/ads");
    return { success: true };
  } catch (error) {
    console.error("Delete ad error:", error);
    return { success: false, error: "Failed to delete ad" };
  }
}

/**
 * Toggle ad status
 */
export async function toggleAdStatus(id: string, status: "active" | "inactive") {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("ads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/ads");
    return { success: true };
  } catch (error) {
    console.error("Toggle ad status error:", error);
    return { success: false, error: "Failed to toggle ad status" };
  }
}
