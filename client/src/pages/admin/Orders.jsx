import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import DatePicker from "../../components/form/date-picker";
import { useMemo, useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrderStatus, deleteOrder, clearOrderMessages, upsertOrder } from "../../redux/slices/orderSlice";
import { useRole } from "../../hooks/useRole";
import socketClient from "../../utils/socketRedux";
import { setupSocketListeners, joinSocketRooms } from "../../utils/socketRedux";
import { useToast } from "../../hooks/useToast";
import { 
  Package, 
  Clock, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Filter,
  SortAsc
} from "lucide-react";

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { isAdmin } = useRole();
  
  const { allOrders, loading, error, successMessage } = useSelector((state) => state.order);
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, isAdmin]);

  // Socket sync for admin dashboard
  useEffect(() => {
    if (!isAdmin) return;
    const s = socketClient.getSocket() || socketClient.initSocket();
    if (!s) return;

    const handleUpdate = (order) => {
      dispatch(upsertOrder(order));
      toast.showToast({ message: `Order ${String(order._id).substring(0,8)} updated`, type: 'success' });
      dispatch(fetchAllOrders());
    };

    // Listen for canonical backend events
    s.on("order:created", handleUpdate);
    s.on("order:updated", handleUpdate);
    s.on("order:status-changed", handleUpdate);
    s.on("order:payment:success", handleUpdate);
    s.on("order:payment-updated", handleUpdate);
    s.on("order:refunded", handleUpdate);
    s.on("order:deleted", (payload) => {
      const id = payload && (payload.orderId || payload._id || payload);
      if (id) dispatch({ type: deleteOrder.fulfilled.type, payload: id });
    });

    return () => {
      s.off("order:created", handleUpdate);
      s.off("order:updated", handleUpdate);
      s.off("order:status-changed", handleUpdate);
      s.off("order:payment:success", handleUpdate);
      s.off("order:payment-updated", handleUpdate);
      s.off("order:refunded", handleUpdate);
      s.off("order:deleted");
    };
  }, [isAdmin, dispatch, toast]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearOrderMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const filtered = useMemo(() => {
    return allOrders.filter((o) => {
      const statusOk = statusFilter === "all" || o.status === statusFilter;
      const dateOk =
        !selectedDate ||
        new Date(o.createdAt).toDateString() === selectedDate.toDateString();
      return statusOk && dateOk;
    });
  }, [allOrders, statusFilter, selectedDate]);

  const exportCSV = () => {
    const header = ["Order ID", "Customer", "Items", "Total", "Status", "Time", "Date"];
    const rows = filtered.map((o) => [
      o._id,
      o.customerName || "Guest",
      o.items?.length || 0,
      o.totalAmount || 0,
      o.status,
      new Date(o.createdAt).toLocaleTimeString(),
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  const handleDeleteOrder = async (orderId) => {
    setDeleting(true);
    try {
      await dispatch(deleteOrder(orderId)).unwrap();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete order: " + (err?.message || "Please try again"));
    } finally {
      setDeleting(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "canceled", label: "Canceled" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-500">Access Denied: Admin only</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Orders Management" description="Manage all customer orders" />
      <PageBreadcrumb pageTitle="Orders Management" />

      {/* Messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-green-600 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header with Stats */}
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Orders Management
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {filtered.length} order{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button 
              onClick={() => dispatch(fetchAllOrders())}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </ComponentCard>

        {/* Filters and Controls */}
        <ComponentCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  options={[
                    { value: "all", label: "All Orders" },
                    { value: "pending", label: "Pending" },
                    { value: "preparing", label: "Preparing" },
                    { value: "ready", label: "Ready" },
                    { value: "completed", label: "Completed" },
                    { value: "canceled", label: "Canceled" },
                  ]}
                  defaultValue="all"
                  onChange={(val) => setStatusFilter(val || "all")}
                />
              </div>
              <div className="w-full sm:w-64">
                <DatePicker
                  id="order-date"
                  placeholder="mm/dd/yyyy"
                  onChange={(dates) => setSelectedDate(dates?.[0] || null)}
                />
              </div>
              <Button onClick={exportCSV} disabled={loading} variant="outline" size="sm">
                📥 Export CSV
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((order) => (
              <ComponentCard
                key={order._id}
                className="relative border-2 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Status Badge and Time */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Order Info */}
                <div className="space-y-3 flex-1">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">ORDER ID</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white">
                      {order._id?.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {order.customerName && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">CUSTOMER</p>
                      <p className="text-sm text-gray-900 dark:text-white">{order.customerName}</p>
                    </div>
                  )}

                  {/* Items Count */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">ITEMS</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">TOTAL</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${(order.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>

                  <button
                    onClick={() => setViewOrder(order)}
                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                  >
                    View Details
                  </button>

                  {(order.status === "completed" || order.status === "canceled") && (
                    <button
                      onClick={() => setDeleteConfirm(order)}
                      className="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-red-200 dark:border-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </ComponentCard>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} className="max-w-sm p-6">
        {deleteConfirm && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Order?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirm._id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>

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
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{viewOrder._id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <p className="capitalize font-medium text-gray-900 dark:text-white">{viewOrder.status}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${(viewOrder.totalAmount || 0).toFixed(2)}</p>
                </div>
                {viewOrder.customerName && (
                  <div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="text-gray-900 dark:text-white">{viewOrder.customerName}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Order Date</p>
                  <p className="text-gray-900 dark:text-white">{new Date(viewOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Items Count</p>
                  <p className="text-gray-900 dark:text-white">{viewOrder.items?.length || 0}</p>
                </div>
              </div>

              {/* Items List */}
              {viewOrder.items && viewOrder.items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-medium text-gray-600 dark:text-gray-400 mb-3">Items</p>
                  <div className="space-y-2">
                    {viewOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-100 dark:bg-gray-800 p-3 rounded flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{item.name || "Item"}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <select
                  value={viewOrder.status}
                  onChange={(e) => {
                    handleStatusUpdate(viewOrder._id, e.target.value);
                    setViewOrder(null);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>

                {(viewOrder.status === "completed" || viewOrder.status === "canceled") && (
                  <button
                    onClick={() => {
                      setDeleteConfirm(viewOrder);
                      setViewOrder(null);
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                  >
                    Delete Order
                  </button>
                )}

                <button
                  onClick={() => setViewOrder(null)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

