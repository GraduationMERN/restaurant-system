// src/features/order/ui/OrderPage.jsx
import OrderList from "./OrderList";
import { useOrdersController } from "../orderController";

const OrderPage = () => {
  const { orders, loading, error } = useOrdersController();

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <OrderList orders={orders} />
    </div>
  );
};

export default OrderPage;
