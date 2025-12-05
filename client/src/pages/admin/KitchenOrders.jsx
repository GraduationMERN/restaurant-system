import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveOrders, updateOrderStatus, clearOrderMessages, upsertOrder } from "../../redux/slices/orderSlice";
import socketClient from "../../utils/socket";
import { useRole } from "../../hooks/useRole";
import { useToast } from "../../hooks/useToast";

export default function KitchenOrders() {
  const dispatch = useDispatch();
  const { isKitchen, isAdmin } = useRole();

  const { activeOrders, loading, error, successMessage } = useSelector((state) => state.order);

  const [viewOrder, setViewOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const toast = useToast();

  // Fetch active orders on mount and refresh periodically
  useEffect(() => {
    if (isKitchen || isAdmin) {
      dispatch(fetchActiveOrders());

      const s = socketClient.getSocket() || socketClient.initSocket();
      if (!s) return;

      const handleCreated = (order) => {
        dispatch(upsertOrder(order));
        dispatch(fetchActiveOrders());
        toast.showToast({ message: `New order ${String(order._id).substring(0,8)} created`, type: 'success' });
      };

      const handleUpdated = (order) => {
        dispatch(upsertOrder(order));
        dispatch(fetchActiveOrders());
      };

      s.on("order:created", handleCreated);
      s.on("order:updated", handleUpdated);
      s.on("order:update", handleUpdated);
      s.on("order:paid", handleUpdated);
      s.on("order:confirmed", handleUpdated);
      s.on("order:preparing", handleUpdated);
      s.on("order:ready", handleUpdated);
      s.on("order:completed", handleUpdated);
      s.on("order:refunded", (order) => { dispatch(upsertOrder(order)); toast.showToast({ message: `Order ${String(order._id).substring(0,8)} refunded`, type: 'success' }); });
      s.on("order:deleted", (payload) => {
        const id = payload && (payload.orderId || payload._id || payload);
        if (id) dispatch({ type: 'order/delete/fulfilled', payload: id });
      });
      s.on("order:estimatedTime", (payload) => {
        if (payload && payload.orderId) dispatch(fetchOrderById ? fetchOrderById(payload.orderId) : fetchActiveOrders());
      });

      return () => {
        s.off("order:created", handleCreated);
        s.off("order:updated", handleUpdated);
        s.off("order:update", handleUpdated);
        s.off("order:paid", handleUpdated);
        s.off("order:confirmed", handleUpdated);
        s.off("order:preparing", handleUpdated);
        s.off("order:ready", handleUpdated);
        s.off("order:completed", handleUpdated);
        s.off("order:refunded");
        s.off("order:deleted");
        s.off("order:estimatedTime");
      };
    }
  }, [dispatch, isKitchen, isAdmin]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearOrderMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  // Filter orders - kitchen sees pending and preparing orders
  const filteredOrders = activeOrders.filter((order) => {
    if (filterStatus === "all") {
      return order.status === "pending" || order.status === "preparing" || order.status === "ready";
    }
    return order.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning-100 border-warning-300 text-warning-800 dark:bg-warning-900/30 dark:border-warning-700 dark:text-warning-200";
      case "preparing":
        return "bg-info-100 border-info-300 text-info-800 dark:bg-info-900/30 dark:border-info-700 dark:text-info-200";
      case "ready":
        return "bg-success-100 border-success-300 text-success-800 dark:bg-success-900/30 dark:border-success-700 dark:text-success-200";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/30 dark:border-gray-700 dark:text-gray-200";
    }
  };

  if (!isKitchen && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-500">Access Denied: Kitchen only</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Kitchen Orders" description="Prepare and manage orders" />
      <PageBreadcrumb pageTitle="Kitchen Dashboard" />

      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-error-600 dark:bg-error-900/20">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-success-50 p-4 text-success-600 dark:bg-success-900/20">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Active Orders
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {["pending", "preparing", "ready", "all"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-brand-500 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </ComponentCard>

        {/* Orders Grid - Kitchen View */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">No orders to prepare</p>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <ComponentCard
                key={order._id}
                className="relative flex flex-col border-2"
              >
                {/* Status Badge */}
                <div
                  className={`mb-3 inline-flex w-fit rounded-lg border px-3 py-1 text-sm font-semibold capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </div>

                {/* Order Info */}
                <div className="space-y-2 flex-1">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      ORDER ID
                    </p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white">
                      {order._id?.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {order.customerName && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        CUSTOMER
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {order.customerName}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      ITEMS ({order.items?.length || 0})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded"
                          >
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {item.quantity}x {item.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No items</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  {order.status === "pending" && (
                    <Button
                      onClick={() => handleStatusChange(order._id, "preparing")}
                      className="w-full bg-info-500 hover:bg-info-600"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === "preparing" && (
                    <Button
                      onClick={() => handleStatusChange(order._id, "ready")}
                      className="w-full bg-success-500 hover:bg-success-600"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === "ready" && (
                    <p className="w-full text-center px-4 py-2 bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-300 rounded font-medium text-sm">
                      Ready for Pickup
                    </p>
                  )}

                  <button
                    onClick={() => setViewOrder(order)}
                    className="w-full px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 rounded border border-brand-200 dark:border-brand-800"
                  >
                    View Details
                  </button>
                </div>
              </ComponentCard>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} className="max-w-2xl p-6">
        {viewOrder && (
          <div className="dark:text-white">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Order Details
            </h3>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Order ID</p>
                  <p className="font-mono font-bold">{viewOrder._id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <p className="capitalize font-medium">{viewOrder.status}</p>
                </div>
                {viewOrder.customerName && (
                  <div className="col-span-2">
                    <p className="font-medium text-gray-600 dark:text-gray-400">Customer</p>
                    <p>{viewOrder.customerName}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              {viewOrder.items && viewOrder.items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Items to Prepare
                  </p>
                  <div className="space-y-2">
                    {viewOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-100 dark:bg-gray-800 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-brand-600 dark:text-brand-400">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                {viewOrder.status === "pending" && (
                  <Button
                    onClick={() => {
                      handleStatusChange(viewOrder._id, "preparing");
                      setViewOrder(null);
                    }}
                    className="w-full bg-info-500 hover:bg-info-600"
                  >
                    Start Preparing
                  </Button>
                )}
                {viewOrder.status === "preparing" && (
                  <Button
                    onClick={() => {
                      handleStatusChange(viewOrder._id, "ready");
                      setViewOrder(null);
                    }}
                    className="w-full bg-success-500 hover:bg-success-600"
                  >
                    Mark Ready
                  </Button>
                )}
                <Button
                  onClick={() => setViewOrder(null)}
                  className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
