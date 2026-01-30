"use server";

import { redirect } from "next/navigation";
import { getDatabaseProvider } from "@/lib/database";
import { createClient } from "@/lib/supabase/server";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";
import { verifyPassword } from "@/utils/password";
import {
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
  verifyAdminSession,
} from "@/utils/session";

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Admin login action
 */
export async function adminLogin(formData: FormData): Promise<ActionResult> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, error: "用户名和密码不能为空" };
  }

  try {
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = await createClient();

      // Query admin_users table
      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("id, username, password_hash")
        .eq("username", username)
        .single();

      if (error || !admin) {
        return { success: false, error: "用户名或密码错误" };
      }

      // Verify password
      const isValid = await verifyPassword(password, admin.password_hash);
      if (!isValid) {
        return { success: false, error: "用户名或密码错误" };
      }

      // Update last login time
      await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", admin.id);

      // Create session
      await createAdminSession(admin.id, admin.username);

      return { success: true };
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();
      const result = await db
        .collection(CloudBaseCollections.ADMIN_USERS)
        .where({ username })
        .get();

      if (!result.data || result.data.length === 0) {
        return { success: false, error: "用户名或密码错误" };
      }

      const admin = result.data[0];

      // Verify password
      const isValid = await verifyPassword(password, admin.password_hash);
      if (!isValid) {
        return { success: false, error: "用户名或密码错误" };
      }

      // Update last login time
      await db
        .collection(CloudBaseCollections.ADMIN_USERS)
        .doc(admin._id)
        .update({
          last_login_at: new Date().toISOString(),
        });

      // Create session
      await createAdminSession(admin._id, admin.username);

      return { success: true };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "登录失败，请稍后重试" };
  }
}

/**
 * Admin logout action
 */
export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return null;
  }

  try {
    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = await createClient();
      const { data: admin } = await supabase
        .from("admin_users")
        .select("id, username, created_at")
        .eq("id", session.userId)
        .single();

      return admin;
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();
      const result = await db
        .collection(CloudBaseCollections.ADMIN_USERS)
        .doc(session.userId)
        .get();

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const admin = result.data[0];
      return {
        id: admin._id,
        username: admin.username,
        created_at: admin.created_at,
      };
    }
  } catch (error) {
    console.error("Get current admin error:", error);
    return null;
  }
}

/**
 * Change password action
 */
export async function changePassword(
  formData: FormData
): Promise<ActionResult> {
  const isAuthenticated = await verifyAdminSession();
  if (!isAuthenticated) {
    return { success: false, error: "未授权" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "所有字段都必须填写" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "新密码和确认密码不匹配" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "新密码长度至少为8个字符" };
  }

  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "会话已过期" };
    }

    const provider = getDatabaseProvider();

    if (provider === "supabase") {
      const supabase = await createClient();

      // Get current password hash
      const { data: admin } = await supabase
        .from("admin_users")
        .select("password_hash")
        .eq("id", session.userId)
        .single();

      if (!admin) {
        return { success: false, error: "用户不存在" };
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, admin.password_hash);
      if (!isValid) {
        return { success: false, error: "当前密码错误" };
      }

      // Hash new password
      const { hashPassword } = await import("@/utils/password");
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      const { error } = await supabase
        .from("admin_users")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.userId);

      if (error) {
        return { success: false, error: "密码更新失败" };
      }

      return { success: true };
    } else {
      // CloudBase
      const db = getCloudBaseDatabase();
      const result = await db
        .collection(CloudBaseCollections.ADMIN_USERS)
        .doc(session.userId)
        .get();

      if (!result.data || result.data.length === 0) {
        return { success: false, error: "用户不存在" };
      }

      const admin = result.data[0];

      // Verify current password
      const isValid = await verifyPassword(currentPassword, admin.password_hash);
      if (!isValid) {
        return { success: false, error: "当前密码错误" };
      }

      // Hash new password
      const { hashPassword } = await import("@/utils/password");
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await db
        .collection(CloudBaseCollections.ADMIN_USERS)
        .doc(session.userId)
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        });

      return { success: true };
    }
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "密码更新失败，请稍后重试" };
  }
}
