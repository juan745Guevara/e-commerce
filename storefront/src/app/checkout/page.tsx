import { CheckoutView } from "@/components/checkout-view";

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-14">
      <h1 className="text-headline text-[2rem]">Checkout</h1>
      <p className="text-body">
        Confirmamos el pedido desde tu bolsa y lo cobramos con la pasarela de
        pago configurada.
      </p>
      <CheckoutView />
    </div>
  );
}
