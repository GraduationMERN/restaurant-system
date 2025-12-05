import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveOrders, createDirectOrder, updateOrderStatus, deleteOrder, clearOrderMessages, upsertOrder, updatePayment } from "../../redux/slices/orderSlice";
import socketClient from "../../utils/socket";
import { useToast } from "../../hooks/useToast";
import { useRole } from "../../hooks/useRole";

export default function CashierOrders() {
  const dispatch = useDispatch();
  const { isCashier, isAdmin } = useRole();
  const toast = useToast();

  const { activeOrders, loading, error, successMessage } = useSelector((state) => state.order);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [isRefunding, setIsRefunding] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    items: [],
    totalAmount: 0,
    serviceType: "dine-in",
    tableNumber: "",
  });

  // Fetch active orders on mount
  useEffect(() => {
    if (isCashier || isAdmin) {
      dispatch(fetchActiveOrders());

      const s = socketClient.getSocket() || socketClient.initSocket();
      if (!s) return;

      const onCreated = (order) => {
        dispatch(upsertOrder(order));
        dispatch(fetchActiveOrders());
      };
      const onUpdated = (order) => {
        dispatch(upsertOrder(order));
        dispatch(fetchActiveOrders());
      };

      const onDeleted = (payload) => {
        // payload may be orderId or order object; remove from active list locally
        const id = payload && (payload._id || payload);
        if (id) {
          dispatch({ type: deleteOrder.fulfilled.type, payload: id });
          toast.showToast({ message: `Order ${String(id).substring(0,8)} deleted`, type: 'success' });
        } else {
          dispatch(fetchActiveOrders());
        }
      };

      const onEstimated = (payload) => {
        // payload may contain order id and estimatedTime; refresh single order or active list
        if (payload && payload._id) {
          dispatch(upsertOrder(payload));
          const mins = payload.estimatedTime || payload.estimatedMinutes || payload.eta;
          if (mins) {
            toast.showToast({ message: `ETA updated: ${mins} min for ${payload._id?.substring(0,8)}`, type: 'success' });
          }
        } else {
          dispatch(fetchActiveOrders());
        }
      };

      const onRefunded = (order) => {
        dispatch(upsertOrder(order));
        toast.showToast({ message: `Order ${order._id?.substring(0,8)} refunded`, type: 'success' });
        dispatch(fetchActiveOrders());
      };

      s.on("order:created", onCreated);
      s.on("order:updated", onUpdated);
      s.on("order:confirmed", onUpdated);
      s.on("order:ready", onUpdated);
      s.on("order:completed", onUpdated);
      s.on("order:refunded", onRefunded);
      s.on("order:deleted", onDeleted);
      s.on("order:estimatedTime", onEstimated);

      return () => {
        s.off("order:created", onCreated);
        s.off("order:updated", onUpdated);
        s.off("order:confirmed", onUpdated);
        s.off("order:ready", onUpdated);
        s.off("order:completed", onUpdated);
        s.off("order:refunded", onRefunded);
        s.off("order:deleted", onDeleted);
        s.off("order:estimatedTime", onEstimated);
      };
    }
  }, [dispatch, isCashier, isAdmin]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearOrderMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleCreateOrder = (e) => {
    e.preventDefault();

    if (!formData.customerName || formData.items.length === 0) {
      alert("Please enter customer name and at least one item");
      return;
    }

    dispatch(
      createDirectOrder({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        items: formData.items,
        totalAmount: formData.totalAmount,
        serviceType: formData.serviceType,
        tableNumber: formData.tableNumber || undefined,
      })
    );

    setFormData({ customerName: "", customerEmail: "", items: [], totalAmount: 0, serviceType: 'dine-in', tableNumber: '' });
    setShowCreateForm(false);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: "", price: 0, quantity: 1 },
      ],
    }));
    // ensure total recalculates after adding a new item
    setTimeout(() => calculateTotal(), 0);
  };

  const removeItem = (idx) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    calculateTotal();
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = field === "quantity" || field === "price" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, items: newItems }));
    calculateTotal();
  };

  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setFormData((prev) => ({ ...prev, totalAmount: total }));
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

  const handleMarkPaid = async (order) => {
    setPaymentProcessing(true);
    try {
      await dispatch(updatePayment({ orderId: order._id, paymentMethod: 'instore', paymentStatus: 'paid' })).unwrap();
      // Refresh
      dispatch(fetchActiveOrders());
      setPaymentModalOrder(null);
    } catch (err) {
      console.error('Failed to mark paid', err);
      alert('Failed to mark order as paid: ' + (err?.message || 'Please try again'));
    } finally {
      setPaymentProcessing(false);
    }
  };

  const openRefundModal = (order) => {
    setRefundModalOrder(order);
    // default refund = full amount
    setRefundAmount(order?.totalAmount || 0);
  };

  const handleRefund = async () => {
    if (!refundModalOrder) return;
    setIsRefunding(true);
    try {
      await dispatch(updatePayment({ orderId: refundModalOrder._id, paymentStatus: 'refunded', refundAmount: parseFloat(refundAmount) || 0 })).unwrap();
      dispatch(fetchActiveOrders());
      setRefundModalOrder(null);
    } catch (err) {
      console.error('Refund failed', err);
      alert('Refund failed: ' + (err?.message || 'Please try again'));
    } finally {
      setIsRefunding(false);
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  if (!isCashier && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-error-500">Access Denied: Cashier only</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Cashier Orders" description="Create and manage orders" />
      <PageBreadcrumb pageTitle="Cashier Orders" />

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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Orders</h3>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancel" : "+ Create Direct Order"}
            </Button>
          </div>
        </ComponentCard>

        {/* Create Order Form */}
        {showCreateForm && (
          <ComponentCard>
            <h4 className="mb-4 font-semibold text-gray-800 dark:text-white">Create Direct Order</h4>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Type</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serviceType: e.target.value }))}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="dine-in">Dine-in</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div>
                  {formData.serviceType === 'dine-in' && (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Table Number (optional)</label>
                      <input
                        type="text"
                        value={formData.tableNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                        placeholder="e.g. 12"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h5 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Items</h5>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(idx, "price", e.target.value)}
                        className="w-24 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-20 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="px-3 py-2 text-error-500 hover:text-error-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={addItem}
                  className="mt-3 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  + Add Item
                </Button>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-brand-500">
                    ${formData.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Order"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ComponentCard>
        )}

        {/* Active Orders Table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="max-w-full overflow-x-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Loading orders...</p>
              </div>
            )}
            {!loading && activeOrders.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">No active orders</p>
              </div>
            )}
            {!loading && activeOrders.length > 0 && (
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
                      className="py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {activeOrders.map((row) => (
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
                      <TableCell className="py-3 capitalize font-medium text-gray-700 dark:text-gray-300">
                        {row.status}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setViewOrder(row)}
                              className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-400"
                            >
                              View
                            </button>
                            {row.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => setPaymentModalOrder(row)}
                                className="text-emerald-600 hover:text-emerald-800"
                              >
                                Mark Paid
                              </button>
                            )}
                            {row.paymentStatus === 'paid' && (
                              <button
                                onClick={() => openRefundModal(row)}
                                className="text-orange-600 hover:text-orange-800"
                              >
                                Refund
                              </button>
                            )}
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

      {/* Mark Paid Modal */}
      <Modal isOpen={!!paymentModalOrder} onClose={() => setPaymentModalOrder(null)} className="max-w-sm p-6">
        {paymentModalOrder && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mark Order as Paid</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to mark order <span className="font-mono">{paymentModalOrder._id?.substring(0,8)}</span> as paid?</p>
            <div className="flex gap-3">
              <button onClick={() => setPaymentModalOrder(null)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
              <button onClick={() => handleMarkPaid(paymentModalOrder)} disabled={paymentProcessing} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded">{paymentProcessing ? 'Processing...' : 'Confirm Paid'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal isOpen={!!refundModalOrder} onClose={() => setRefundModalOrder(null)} className="max-w-sm p-6">
        {refundModalOrder && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Refund Payment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Order: <span className="font-mono">{refundModalOrder._id?.substring(0,8)}</span></p>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Refund Amount</label>
            <input type="number" value={refundAmount} onChange={(e)=>setRefundAmount(e.target.value)} className="w-full rounded border px-3 py-2 mb-4 dark:bg-gray-800" />
            <div className="flex gap-3">
              <button onClick={() => setRefundModalOrder(null)} disabled={isRefunding} className="flex-1 px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleRefund} disabled={isRefunding} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded">{isRefunding ? 'Refunding...' : 'Issue Refund'}</button>
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
              </div>

              {/* Cashier controls to update status and estimated time */}
              {(isCashier || isAdmin) && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="mb-2 font-semibold">Manage Order</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="col-span-2 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <option value="">-- Select status --</option>
                      <option value="confirmed">Confirm</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Estimated minutes"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => {
                        const statusToSend = selectedStatus || viewOrder.status;
                        const est = estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined;
                        dispatch(updateOrderStatus({ orderId: viewOrder._id, status: statusToSend, estimatedTime: est }));
                        setSelectedStatus("");
                        setEstimatedMinutes("");
                        setViewOrder(null);
                      }}
                    >
                      Update
                    </Button>
                    <Button onClick={() => { setSelectedStatus(""); setEstimatedMinutes(""); }}>Reset</Button>
                  </div>
                </div>
              )}

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
