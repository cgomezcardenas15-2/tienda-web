import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, validateAdminCredentials } from "@/app/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    if (!validateAdminCredentials(email, password)) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

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

