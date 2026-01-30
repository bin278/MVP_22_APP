"use server";

import { verifyAdminSession } from "@/utils/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all social links
 */
export async function getSocialLinks() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw error;

    return data as SocialLink[];
  } catch (error) {
    console.error("Get social links error:", error);
    throw error;
  }
}

/**
 * Create social link
 */
export async function createSocialLink(formData: FormData) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const linkData = {
      platform: formData.get("platform") as string,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string,
      order: parseInt(formData.get("order") as string) || 0,
      visible: formData.get("visible") === "true",
    };

    const { data, error } = await supabase
      .from("social_links")
      .insert(linkData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/social-links");
    return { success: true, data };
  } catch (error) {
    console.error("Create social link error:", error);
    return { success: false, error: "Failed to create social link" };
  }
}

/**
 * Update social link
 */
export async function updateSocialLink(id: string, formData: FormData) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const linkData = {
      platform: formData.get("platform") as string,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string,
      order: parseInt(formData.get("order") as string) || 0,
      visible: formData.get("visible") === "true",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("social_links")
      .update(linkData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/social-links");
    return { success: true, data };
  } catch (error) {
    console.error("Update social link error:", error);
    return { success: false, error: "Failed to update social link" };
  }
}

/**
 * Delete social link
 */
export async function deleteSocialLink(id: string) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("social_links").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/social-links");
    return { success: true };
  } catch (error) {
    console.error("Delete social link error:", error);
    return { success: false, error: "Failed to delete social link" };
  }
}

/**
 * Toggle social link visibility
 */
export async function toggleSocialLinkVisibility(id: string, visible: boolean) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("social_links")
      .update({ visible, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/social-links");
    return { success: true };
  } catch (error) {
    console.error("Toggle social link visibility error:", error);
    return { success: false, error: "Failed to toggle visibility" };
  }
}
