import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getAdminSession } from "@/app/lib/adminAuth";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin/pedidos");

  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white">
      <section className="mx-auto max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-lime-400">NOVA ADMIN</p>
        <h1 className="mt-3 text-3xl font-black">Acceso privado</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Ingresa con las credenciales administrativas. Los compradores no pueden acceder a esta sección.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

