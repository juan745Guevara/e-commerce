import { OrdersView } from "@/components/orders-view";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-4xl">Mis pedidos</h1>
      <OrdersView />
    </div>
  );
}
