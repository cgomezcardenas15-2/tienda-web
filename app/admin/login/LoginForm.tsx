"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (response.ok) {
      window.location.assign("/admin/pedidos");
      return;
    }

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    setError(result?.error || "No fue posible iniciar sesión.");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-zinc-300">Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-zinc-300">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-lime-400"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="w-full rounded-xl bg-lime-400 px-4 py-3 font-bold text-black transition hover:bg-lime-300 disabled:opacity-60"
      >
        {loading ? "Ingresando..." : "Ingresar al panel"}
      </button>
    </form>
  );
}

