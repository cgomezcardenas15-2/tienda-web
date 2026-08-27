import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "nova_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

type AdminSession = {
  email: string;
  expiresAt: number;
};

function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !password || !sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      "Faltan ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_SESSION_SECRET (mínimo 32 caracteres).",
    );
  }

  return { email, password, sessionSecret };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeSession(session: AdminSession, secret: string) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function decodeSession(value: string, secret: string): AdminSession | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;

    if (
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function validateAdminCredentials(email: string, password: string) {
  const config = getAdminConfig();
  return (
    safeEqual(email.trim().toLowerCase(), config.email) &&
    safeEqual(password, config.password)
  );
}

export async function createAdminSession() {
  const config = getAdminConfig();
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const value = encodeSession({ email: config.email, expiresAt }, config.sessionSecret);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  try {
    const { sessionSecret } = getAdminConfig();
    const value = (await cookies()).get(COOKIE_NAME)?.value;
    return value ? decodeSession(value, sessionSecret) : null;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

