"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const phone = String(formData.get("phone") ?? "").trim();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        ...(phone ? { phone } : {}),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "No se pudo crear la cuenta");
      return;
    }
    router.push("/catalogo");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-ink/15 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="rounded-xl border border-ink/15 bg-white px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        WhatsApp (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="51999999999"
          className="rounded-xl border border-ink/15 bg-white px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
