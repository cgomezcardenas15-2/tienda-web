import { NextRequest, NextResponse } from "next/server";
import {
  clearLoginAttempts,
  createAdminSession,
  getLoginLimit,
  isSameOriginRequest,
  recordFailedLogin,
  validateAdminCredentials,
} from "@/app/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const limit = getLoginLimit(request, email);
  if (limit.blocked) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  try {
    if (!validateAdminCredentials(email, password)) {
      recordFailedLogin(request, email);
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

    clearLoginAttempts(request, email);
    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error configurando acceso administrativo:", error);
    return NextResponse.json(
      { error: "El acceso administrativo aún no está configurado." },
      { status: 503 },
    );
  }
}

