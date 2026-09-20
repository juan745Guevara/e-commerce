import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <h1 className="text-headline text-[2rem]">Bolsa</h1>
      <CartView />
    </div>
  );
}
