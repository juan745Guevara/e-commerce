import Link from "next/link";

const columns = [
  {
    title: "Comprar",
    links: [
      { href: "/catalogo", label: "Todos los productos" },
      { href: "/catalogo", label: "Ofertas" },
      { href: "/pedidos", label: "Mis pedidos" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/registro", label: "Crear cuenta" },
      { href: "/carrito", label: "Carrito" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="text-eyebrow text-foreground">{column.title}</p>
              <ul className="flex flex-col gap-2 text-sm text-muted">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <p className="text-eyebrow text-foreground">Atelier</p>
            <p className="text-sm text-muted">
              Tecnología seleccionada, entregada con cuidado a todo el país.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Atelier. Todos los derechos reservados.</p>
          <p>Los precios incluyen impuestos donde aplica.</p>
        </div>
      </div>
    </footer>
  );
}
