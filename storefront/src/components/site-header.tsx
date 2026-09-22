"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { browserApi } from "@/lib/api/browser";
import { CART_CHANGED_EVENT } from "@/lib/cart/cart-events";
import { LogoutButton } from "./logout-button";

type SessionUser = { email: string; role: string };

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/pedidos", label: "Pedidos" },
];

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((body: { user: SessionUser | null }) => setUser(body.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadCartCount = () => {
      void browserApi
        .getCart()
        .then((cart) => {
          if (!cancelled) setCartCount(cart.items.length);
        })
        .catch(() => {
          if (!cancelled) setCartCount(0);
        });
    };

    loadCartCount();
    window.addEventListener(CART_CHANGED_EVENT, loadCartCount);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, loadCartCount);
    };
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const badgeCount = user ? cartCount : 0;

  return (
    <header
      className={`glass-nav sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-foreground"
        >
          Atelier
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] text-muted sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground active:opacity-60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[13px] text-muted">
          {user ? (
            <>
              <span className="hidden text-foreground/70 md:inline">
                {user.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="transition-colors hover:text-foreground active:opacity-60"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/carrito"
            aria-label="Carrito"
            className="relative flex items-center text-foreground transition hover:text-muted active:scale-90"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M6 8h12l-1.2 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {badgeCount > 0 ? (
              <motion.span
                key={badgeCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white"
              >
                {badgeCount}
              </motion.span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
