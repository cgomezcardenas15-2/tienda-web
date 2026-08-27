import { NextRequest, NextResponse } from "next/server";
import { deleteAdminSession } from "@/app/lib/adminAuth";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  await deleteAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}

