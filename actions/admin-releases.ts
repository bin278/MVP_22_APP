"use server";

import { verifyAdminSession } from "@/utils/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Release {
  id: string;
  version: string;
  title: string;
  description: string;
  platform: string;
  download_url: string;
  status: "draft" | "published" | "archived";
  release_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all releases
 */
export async function getReleases() {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    throw new Error("Unauthorized");
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("releases")
      .select("*")
      .order("release_date", { ascending: false });

    if (error) throw error;

    return data as Release[];
  } catch (error) {
    console.error("Get releases error:", error);
    throw error;
  }
}

/**
 * Create release
 */
export async function createRelease(formData: FormData) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const releaseData = {
      version: formData.get("version") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      platform: formData.get("platform") as string,
      download_url: formData.get("download_url") as string,
      status: formData.get("status") as "draft" | "published" | "archived",
      release_date: formData.get("release_date") as string,
    };

    const { data, error } = await supabase
      .from("releases")
      .insert(releaseData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/releases");
    return { success: true, data };
  } catch (error) {
    console.error("Create release error:", error);
    return { success: false, error: "Failed to create release" };
  }
}

/**
 * Delete release
 */
export async function deleteRelease(id: string) {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("releases").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/releases");
    return { success: true };
  } catch (error) {
    console.error("Delete release error:", error);
    return { success: false, error: "Failed to delete release" };
  }
}
