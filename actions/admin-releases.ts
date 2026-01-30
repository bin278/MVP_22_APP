"use server";

import { verifyAdminSession } from "@/utils/session";
import { getDatabaseProvider } from "@/lib/database";
import { createClient } from "@/lib/supabase/server";
import { getCloudBaseDatabase, CloudBaseCollections, generateId } from "@/lib/database/cloudbase-client";
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
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .order("release_date", { ascending: false });

      if (error) throw error;

      return data as Release[];
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();
      const result = await db
        .collection(CloudBaseCollections.RELEASES)
        .orderBy("release_date", "desc")
        .get();

      return result.data.map((item: any) => ({
        ...item,
        id: item._id,
      })) as Release[];
    }
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
    const provider = getDatabaseProvider();

    const releaseData = {
      version: formData.get("version") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      platform: formData.get("platform") as string,
      download_url: formData.get("download_url") as string,
      status: formData.get("status") as "draft" | "published" | "archived",
      release_date: formData.get("release_date") as string,
    };

    if (provider === "supabase") {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("releases")
        .insert(releaseData)
        .select()
        .single();

      if (error) throw error;

      revalidatePath("/admin/releases");
      return { success: true, data };
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();

      const newRelease = {
        _id: generateId(),
        ...releaseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db
        .collection(CloudBaseCollections.RELEASES)
        .add(newRelease);

      revalidatePath("/admin/releases");
      return { success: true, data: { ...newRelease, id: newRelease._id } };
    }
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
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = await createClient();

      const { error } = await supabase.from("releases").delete().eq("id", id);

      if (error) throw error;

      revalidatePath("/admin/releases");
      return { success: true };
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();

      await db
        .collection(CloudBaseCollections.RELEASES)
        .doc(id)
        .remove();

      revalidatePath("/admin/releases");
      return { success: true };
    }
  } catch (error) {
    console.error("Delete release error:", error);
    return { success: false, error: "Failed to delete release" };
  }
}
