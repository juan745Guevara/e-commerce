import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-4xl">Carrito</h1>
      <CartView />
    </div>
  );
}
