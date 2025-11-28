// src/features/order/ui/OrderCard.jsx
const OrderCard = ({ order }) => {
  const statusColor = {
    pending: "bg-yellow-200 text-yellow-800",
    preparing: "bg-blue-200 text-blue-800",
    completed: "bg-green-200 text-green-800",
    cancelled: "bg-red-200 text-red-800",
  };

  return (
    <div className="border rounded p-4 shadow mb-2 flex justify-between items-center">
      <div>
        <h3 className="font-bold">{order.customer}</h3>
        <p>Total: ${order.total}</p>
      </div>
      <span className={`px-3 py-1 rounded ${statusColor[order.status] || "bg-gray-200"}`}>
        {order.status}
      </span>
    </div>
  );
};

export default OrderCard;
