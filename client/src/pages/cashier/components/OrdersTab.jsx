// OrdersTab.jsx - View and manage existing orders
import React, { useState, useEffect } from "react";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import api from "../../../api/axios";
import socketClient, { setupSocketListeners, joinSocketRooms } from "../../../utils/socketRedux";
import { useToast } from "../../../hooks/useToast";
import { useSelector } from "react-redux";
import FilterBar from "./FilterBar";
import SortBar from "./SortBar";
import OrderCard from "./OrderCard";
import OrderDetailsModal from "./OrderDetailsModal";
import StatusUpdateModal from "./StatusUpdateModal";
import PaymentUpdateModal from "./PaymentUpdateModal";

export default function OrdersTab() {
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState(null);
  const [paymentUpdateOrder, setPaymentUpdateOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = socketClient.getSocket() || socketClient.initSocket();
    if (!socket) return;

    // Setup global socket listeners (handles Redux dispatches)
    setupSocketListeners(socket);

    // Join socket rooms
    if (user) {
      joinSocketRooms(socket, user);
    }

    // Listen for order status changes
    const handleStatusChange = (data) => {
      console.log("Cashier: Order status changed", data);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === (data.orderId || data._id)
            ? {
                ...order,
                status: data.status,
                estimatedReadyTime: data.estimatedReadyTime || order.estimatedReadyTime,
              }
            : order
        )
      );
      // Show toast
      toast.showToast({
        message: `Order #${data.orderNumber || "updated"}: ${data.status.toUpperCase()}`,
        type: "info",
        duration: 2000,
      });
      // Update modal if open
      if (statusUpdateOrder && statusUpdateOrder._id === (data.orderId || data._id)) {
        setStatusUpdateOrder((prev) => ({
          ...prev,
          status: data.status,
          estimatedReadyTime: data.estimatedReadyTime || prev.estimatedReadyTime,
        }));
      }
    };

    // Listen for payment status changes
    const handlePaymentChange = (data) => {
      console.log("Cashier: Order payment changed", data);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === (data.orderId || data._id)
            ? {
                ...order,
                paymentStatus: data.paymentStatus,
                paidAt: data.paidAt || order.paidAt,
              }
            : order
        )
      );
      // Show toast
      if (data.paymentStatus === "paid") {
        toast.showToast({
          message: "✅ Payment received",
          type: "success",
          duration: 2000,
        });
      }
      // Update modal if open
      if (paymentUpdateOrder && paymentUpdateOrder._id === (data.orderId || data._id)) {
        setPaymentUpdateOrder((prev) => ({
          ...prev,
          paymentStatus: data.paymentStatus,
          paidAt: data.paidAt || prev.paidAt,
        }));
      }
    };

    // Listen for new orders
    const handleNewOrder = (order) => {
      console.log("Cashier: New order received", order);
      setOrders((prevOrders) => [order, ...prevOrders]);
      toast.showToast({
        message: `📋 New order: #${order.orderNumber}`,
        type: "success",
        duration: 3000,
      });
    };

    socket.on("order:status-changed", handleStatusChange);
    socket.on("order:your-status-changed", handleStatusChange);
    socket.on("order:payment-updated", handlePaymentChange);
    socket.on("order:your-payment-updated", handlePaymentChange);
    socket.on("order:new", handleNewOrder);

    return () => {
      socket.off("order:status-changed", handleStatusChange);
      socket.off("order:your-status-changed", handleStatusChange);
      socket.off("order:payment-updated", handlePaymentChange);
      socket.off("order:your-payment-updated", handlePaymentChange);
      socket.off("order:new", handleNewOrder);
    };
  }, [statusUpdateOrder, paymentUpdateOrder, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("api/orders");
      setOrders(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.showToast({message:"Failed to load orders"});
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => activeFilter === "all" || order.status === activeFilter)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      const aItems = a.items?.length || 0;
      const bItems = b.items?.length || 0;
      const aPrep = bTime - aTime; // Prep time in ms
      const bPrep = bTime - bTime; // Prep time in ms

      switch (activeSort) {
        case "newest":
          return bTime - aTime;
        case "oldest":
          return aTime - bTime;
        case "shortest_prep":
          return aPrep - bPrep;
        case "longest_prep":
          return bPrep - aPrep;
        case "fewest_items":
          return aItems - bItems;
        case "most_items":
          return bItems - aItems;
        default:
          return 0;
      }
    });

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await api.patch(`api/orders/${orderId}/status`, {
        status: newStatus,
      });

      const updatedOrder = response.data.data || response.data;
      setOrders(orders.map((o) => (o._id === orderId ? updatedOrder : o)));
      toast.showToast({message:"Order status updated"});
      setStatusUpdateOrder(null);
    } catch (error) {

      toast.showToast({message:"Failed to update order status"});
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePayment = async (orderId, newPaymentStatus) => {
    try {
      setUpdatingPayment(true);
      const response = await api.patch(`api/orders/${orderId}/payment`, {
        paymentStatus: newPaymentStatus,
      });

      const updatedOrder = response.data.data || response.data;
      setOrders(orders.map((o) => (o._id === orderId ? updatedOrder : o)));
      toast.showToast({message:"Payment status updated"});
      setPaymentUpdateOrder(null);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.showToast({message:"Failed to payment status"});
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      setDeletingId(orderId);
      await api.delete(`api/orders/${orderId}`);
      setOrders(orders.filter((o) => o._id !== orderId));
      toast.showToast({message:"Order deleted"});
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.showToast({message:"Failed to delete order"});
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <SortBar activeSort={activeSort} onSortChange={setActiveSort} />

      {/* Orders Count */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-bold">{filteredOrders.length}</span> order(s) found
        </p>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onViewDetails={setSelectedOrder}
              onUpdateStatus={setStatusUpdateOrder}
              onUpdatePayment={setPaymentUpdateOrder}
              onDelete={handleDeleteOrder}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h3>
          <p className="text-slate-600">
            {activeFilter !== "all"
              ? `There are no ${activeFilter} orders`
              : "There are no orders yet"}
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {statusUpdateOrder && (
        <StatusUpdateModal
          order={statusUpdateOrder}
          onClose={() => setStatusUpdateOrder(null)}
          onUpdate={handleUpdateStatus}
          loading={updatingStatus}
        />
      )}

      {paymentUpdateOrder && (
        <PaymentUpdateModal
          order={paymentUpdateOrder}
          onClose={() => setPaymentUpdateOrder(null)}
          onUpdate={handleUpdatePayment}
          loading={updatingPayment}
        />
      )}
    </div>
  );
}
