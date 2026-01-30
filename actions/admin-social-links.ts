"use server";

import { verifyAdminSession } from "@/utils/session";
import { getDatabaseProvider } from "@/lib/database";
import { getSupabaseAdmin } from "@/lib/database/supabase";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";
import { revalidatePath } from "next/cache";

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  region: "global" | "cn" | "all";
  order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all social links from the configured database
 */
export async function getSocialLinks() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;

      return data as SocialLink[];
    } else {
      const db = getCloudBaseDatabase();
      const result = await db
        .collection(CloudBaseCollections.SOCIAL_LINKS)
        .orderBy("order", "asc")
        .get();

      return (result.data || []).map((link: any) => ({
        id: link._id || link.id,
        ...link,
      })) as SocialLink[];
    }
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
    const linkData = {
      platform: formData.get("platform") as string,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string,
      region: formData.get("region") as "global" | "cn" | "all",
      order: parseInt(formData.get("order") as string) || 0,
      visible: formData.get("visible") === "true",
    };

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseAdmin();
      if (!supabase) throw new Error("Supabase not available");

      const { data, error } = await supabase
        .from("social_links")
        .insert(linkData)
        .select()
        .single();

      if (error) throw error;

      revalidatePath("/admin/social-links");
      return { success: true, data };
    } else {
      const db = getCloudBaseDatabase();
      const result = await db.collection(CloudBaseCollections.SOCIAL_LINKS).add({
        ...linkData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      revalidatePath("/admin/social-links");
      return { success: true, data: { id: result.id } };
    }
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
    const linkData = {
      platform: formData.get("platform") as string,
      url: formData.get("url") as string,
      icon: formData.get("icon") as string,
      region: formData.get("region") as "global" | "cn" | "all",
      order: parseInt(formData.get("order") as string) || 0,
      visible: formData.get("visible") === "true",
      updated_at: new Date().toISOString(),
    };

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseAdmin();
      if (!supabase) throw new Error("Supabase not available");

      const { data, error } = await supabase
        .from("social_links")
        .update(linkData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      revalidatePath("/admin/social-links");
      return { success: true, data };
    } else {
      const db = getCloudBaseDatabase();
      await db.collection(CloudBaseCollections.SOCIAL_LINKS).doc(id).update(linkData);

      revalidatePath("/admin/social-links");
      return { success: true };
    }
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
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseAdmin();
      if (!supabase) throw new Error("Supabase not available");

      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
    } else {
      const db = getCloudBaseDatabase();
      await db.collection(CloudBaseCollections.SOCIAL_LINKS).doc(id).remove();
    }

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
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = getSupabaseAdmin();
      if (!supabase) throw new Error("Supabase not available");

      const { error } = await supabase
        .from("social_links")
        .update({ visible, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    } else {
      const db = getCloudBaseDatabase();
      await db.collection(CloudBaseCollections.SOCIAL_LINKS).doc(id).update({
        visible,
        updated_at: new Date().toISOString(),
      });
    }

    revalidatePath("/admin/social-links");
    return { success: true };
  } catch (error) {
    console.error("Toggle social link visibility error:", error);
    return { success: false, error: "Failed to toggle visibility" };
  }
}
