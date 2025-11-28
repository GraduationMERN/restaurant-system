import OrderCard from "./OrderCard";

const OrderList = ({ orders }) => {
  return (
    <div>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found</p>
      ) : (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      )}
    </div>
  );
};

export default OrderList;
