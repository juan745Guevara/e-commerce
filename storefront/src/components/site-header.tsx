"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "./logout-button";

type SessionUser = { email: string; role: string };

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((body: { user: SessionUser | null }) => setUser(body.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink">
          Atelier
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ink/80">
          <Link href="/catalogo" className="hover:text-ink">
            Catálogo
          </Link>
          <Link href="/carrito" className="hover:text-ink">
            Carrito
          </Link>
          {user ? (
            <>
              <Link href="/pedidos" className="hover:text-ink">
                Pedidos
              </Link>
              <span className="hidden text-ink/50 sm:inline">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="hover:text-ink">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
