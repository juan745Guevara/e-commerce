import type { OrderStatus } from "@/lib/api/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDIENTE", label: "Pendiente" },
  { status: "PAGADO", label: "Pagado" },
  { status: "ENVIADO", label: "Enviado" },
  { status: "ENTREGADO", label: "Entregado" },
];

/**
 * Línea de tiempo del pedido. CANCELADO no es un paso más de la fila —
 * solo se llega ahí desde PENDIENTE, así que se muestra como un estado
 * aparte en vez de forzarlo dentro de una secuencia lineal que no siguió.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELADO") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-red-600">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
        Cancelado antes de pagarse — el stock volvió al catálogo
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.status === status);

  return (
    <div
      className="flex w-full items-start"
      role="list"
      aria-label={`Progreso del pedido: paso actual ${STEPS[currentIndex]?.label ?? status}`}
    >
      {STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        const lineFilled = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.status}
            role="listitem"
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-1 flex-col items-center text-center"
          >
            <div className="flex w-full items-center">
              <span
                className={`flex h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${
                  reached ? "bg-accent" : "bg-line"
                }`}
                aria-hidden
              />
              {index < STEPS.length - 1 ? (
                <span
                  className={`mx-1.5 h-px flex-1 transition-colors ${
                    lineFilled ? "bg-accent" : "bg-line"
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
            <span
              className={`mt-2 text-[11px] ${
                isCurrent
                  ? "font-medium text-foreground"
                  : reached
                    ? "text-foreground/80"
                    : "text-muted"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
