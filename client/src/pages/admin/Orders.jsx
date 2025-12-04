import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import DatePicker from "../../components/form/date-picker";
import { useMemo, useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrderStatus, deleteOrder, clearOrderMessages } from "../../redux/slices/orderSlice";
import { useRole } from "../../hooks/useRole";

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { isAdmin } = useRole();
  
  const { allOrders, loading, error, successMessage } = useSelector((state) => state.order);

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
        return "warning";
      case "preparing":
        return "info";
      case "ready":
        return "success";
      case "completed":
        return "success";
      case "canceled":
        return "error";
      default:
        return "default";
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
        <ComponentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <div className="w-full sm:w-64">
                <DatePicker
                  id="order-date"
                  placeholder="mm/dd/yyyy"
                  onChange={(dates) => setSelectedDate(dates?.[0] || null)}
                />
              </div>
            </div>
            <Button onClick={exportCSV} disabled={loading}>
              {loading ? "Loading..." : "Export CSV"}
            </Button>
          </div>
        </ComponentCard>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="max-w-full overflow-x-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Loading orders...</p>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      ORDER ID
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      CUSTOMER
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      ITEMS
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      TOTAL
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      STATUS
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      TIME
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((row) => (
                    <TableRow
                      key={row._id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {row._id?.substring(0, 8).toUpperCase() || "N/A"}
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                        {row.customerName || "Guest"}
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {row.items?.length || 0} items
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                        ${(row.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Select
                          options={STATUS_OPTIONS}
                          defaultValue={row.status}
                          onChange={(val) => handleStatusUpdate(row._id, val)}
                          className="w-32"
                          variant="pill"
                          size="sm"
                          color={getStatusColor(row.status)}
                        />
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {new Date(row.createdAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setViewOrder(row)}
                            className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-400"
                          >
                            View
                          </button>
                          {(row.status === "completed" || row.status === "canceled") && (
                            <button
                              onClick={() => setDeleteConfirm(row)}
                              className="text-error-500 hover:text-error-700 dark:hover:text-error-400"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
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
                className="flex-1 px-4 py-2 bg-error-500 text-white rounded font-medium hover:bg-error-600 transition-colors disabled:opacity-50"
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Order Details
            </h3>
            <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Order ID</p>
                  <p>{viewOrder._id}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Customer</p>
                  <p>{viewOrder.customerName || "Guest"}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-lg">
                    ${(viewOrder.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <p className="capitalize font-medium">{viewOrder.status}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Order Date</p>
                  <p>{new Date(viewOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 dark:text-gray-400">Items Count</p>
                  <p>{viewOrder.items?.length || 0}</p>
                </div>
              </div>

              {/* Items List */}
              {viewOrder.items && viewOrder.items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-medium text-gray-600 dark:text-gray-400 mb-2">Items</p>
                  <div className="space-y-2">
                    {viewOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name || "Item"}</span>
                        <span>
                          {item.quantity} x ${item.price?.toFixed(2) || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
