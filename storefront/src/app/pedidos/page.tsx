import { OrdersView } from "@/components/orders-view";

export default function OrdersPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-14">
      <h1 className="text-headline text-[2rem]">Mis pedidos</h1>
      <OrdersView />
    </div>
  );
}
