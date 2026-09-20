"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

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
    <form
      action={onSubmit}
      className="flex flex-col gap-4 rounded-3xl bg-surface p-6"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        WhatsApp (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="51999999999"
          className="rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <motion.button
        type="submit"
        disabled={pending}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="btn-pill py-3"
      >
        {pending ? "Creando…" : "Crear cuenta"}
      </motion.button>
    </form>
  );
}
