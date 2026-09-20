import { CheckoutView } from "@/components/checkout-view";

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <p className="text-ink/70">
        Confirmamos el pedido desde tu carrito. El pago usa el token de la
        pasarela configurada en el backend.
      </p>
      <CheckoutView />
    </div>
  );
}
