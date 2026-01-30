import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret-key-change-in-production";

export interface AdminSession {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

// Simple signature for session validation
function createSignature(data: string): string {
  // In production, use a proper HMAC implementation
  const hash = Buffer.from(SESSION_SECRET + data).toString("base64");
  return hash.substring(0, 32);
}

function verifySignature(data: string, signature: string): boolean {
  return createSignature(data) === signature;
}

// Create admin session
export async function createAdminSession(userId: string, username: string): Promise<void> {
  const now = Date.now();
  const session: AdminSession = {
    userId,
    username,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000,
  };

  const sessionData = JSON.stringify(session);
  const signature = createSignature(sessionData);
  const token = Buffer.from(`${sessionData}.${signature}`).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

// Get admin session
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [sessionData, signature] = decoded.split(".");

    if (!verifySignature(sessionData, signature)) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionData);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      await destroyAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session:", error);
    return null;
  }
}

// Verify admin session (returns boolean)
export async function verifyAdminSession(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

// Destroy admin session (logout)
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Refresh admin session (extend expiration)
export async function refreshAdminSession(): Promise<void> {
  const session = await getAdminSession();
  if (session) {
    await createAdminSession(session.userId, session.username);
  }
}

// Verify session token (for middleware)
export function verifyAdminSessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [sessionData, signature] = decoded.split(".");

    if (!verifySignature(sessionData, signature)) {
      return false;
    }

    const session: AdminSession = JSON.parse(sessionData);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
